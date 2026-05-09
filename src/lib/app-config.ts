import { db } from "@/db";
import { appConfig } from "@/db/schema/app-config-schema";
import { eq } from "drizzle-orm";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { value: string; timestamp: number }>();

export function clearConfigCache(): void {
  cache.clear();
}

export async function getConfig(key: string): Promise<string | null> {
  const envKey = key.toUpperCase();
  const envOverride = process.env[envKey];
  if (envOverride !== undefined) return envOverride;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const row = await db
      .select({ value: appConfig.value })
      .from(appConfig)
      .where(eq(appConfig.key, key))
      .limit(1);

    if (row.length > 0) {
      cache.set(key, { value: row[0].value, timestamp: Date.now() });
      return row[0].value;
    }
  } catch (error) {
    console.error(`[app-config] DB error for key="${key}":`, error);
  }

  return null;
}

export async function isAvatarUploadEnabled(): Promise<boolean> {
  const value = await getConfig("avatar_upload_enabled");
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

  cache.delete(key);
}
