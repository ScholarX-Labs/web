import { db } from "@/db";
import { appConfig } from "@/db/schema/app-config-schema";
import { eq } from "drizzle-orm";
import { createServerCache } from "@/lib/cache/cache.factory";
import { cachePolicy } from "@/lib/cache/cache-policy";
import { markSharedRedisUnavailable } from "@/lib/cache/shared-redis";

const cache = createServerCache();

export async function clearConfigCache(key?: string): Promise<void> {
  if (!key) return;

  try {
    await cache.delete(cachePolicy.config.key(key));
  } catch (error) {
    markSharedRedisUnavailable(`config-clear:${key}`, error);
  }
}

/**
 * Retrieves a configuration value by key.
 *
 * Lookup order: environment variable → in-memory cache → database.
 *
 * IMPORTANT: Environment variables (process.env[KEY]) take precedence over DB
 * values and the in-memory cache. If an env var is set, calls to setConfig()
 * and clearConfigCache() have no effect for that key — the env override always
 * wins. This is an intentional emergency-override mechanism (e.g., kill switch
 * via Azure App Settings).
 *
 * If DB-first semantics are desired, reverse the lookup order or ensure callers
 * (storage-check route, admin config API) clear the env var before relying on
 * DB writes.
 */
export async function getConfig(key: string): Promise<string | null> {
  const envKey = key.toUpperCase();
  const envOverride = process.env[envKey];
  if (envOverride !== undefined) return envOverride;

  try {
    const cached = await cache.getJson<string>(cachePolicy.config.key(key));
    if (cached !== null) {
      return cached;
    }
  } catch (error) {
    markSharedRedisUnavailable(`config-get:${key}`, error);
  }

  try {
    const row = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);

    if (row.length > 0) {
      try {
        await cache.setJson(cachePolicy.config.key(key), row[0].value, cachePolicy.config.ttlSeconds);
      } catch (error) {
        markSharedRedisUnavailable(`config-set:${key}`, error);
      }
      return row[0].value;
    }
  } catch (error) {
    console.error(`[app-config] DB error for key="${key}":`, error);
  }

  return null;
}

export async function isAvatarUploadEnabled(): Promise<boolean> {
  const value = await getConfig("avatar_upload_enabled");
  if (value === null) return false;
  return value !== "false";
}

export async function setConfig(
  key: string,
  value: string,
  updatedBy?: string
): Promise<void> {
  await db
    .insert(appConfig)
    .values({ key, value, updatedBy: updatedBy ?? "system" })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: {
        value,
        updatedBy: updatedBy ?? "system",
        updatedAt: new Date(),
      },
    });

  try {
    await cache.setJson(cachePolicy.config.key(key), value, cachePolicy.config.ttlSeconds);
  } catch (error) {
    markSharedRedisUnavailable(`config-write-through:${key}`, error);
  }
}

export async function isArabicEnabled(): Promise<boolean> {
  const value = await getConfig("arabic_enabled");
  if (value === null) {
    const envVal = process.env.ARABIC_ENABLED;
    if (envVal !== undefined) {
      return envVal !== "false";
    }
    return true;
  }
  return value !== "false";
}
