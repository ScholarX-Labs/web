import { createServerCache } from "@/lib/cache/cache.factory";
import { cachePolicy } from "@/lib/cache/cache-policy";
import { markSharedRedisUnavailable } from "@/lib/cache/shared-redis";

const cache = createServerCache();

export function getAdminStatsCacheKey(): string {
  return cachePolicy.admin.statsKey();
}

export function getAdminReportCacheKey(
  type: "revenue" | "users" | "courses",
  range: { from: string; to: string },
): string {
  return cachePolicy.admin.reportKey(type, range);
}

export async function getCachedAdminValue<T>(key: string): Promise<T | null> {
  try {
    return await cache.getJson<T>(key);
  } catch (error) {
    markSharedRedisUnavailable(`admin-cache-get:${key}`, error);
    return null;
  }
}

export async function setCachedAdminStats<T>(key: string, value: T): Promise<void> {
  try {
    await cache.setJson(key, value, cachePolicy.admin.statsTtlSeconds);
  } catch (error) {
    markSharedRedisUnavailable(`admin-cache-stats-set:${key}`, error);
  }
}

export async function setCachedAdminReport<T>(key: string, value: T): Promise<void> {
  try {
    await cache.setJson(key, value, cachePolicy.admin.reportTtlSeconds);
  } catch (error) {
    markSharedRedisUnavailable(`admin-cache-report-set:${key}`, error);
  }
}
