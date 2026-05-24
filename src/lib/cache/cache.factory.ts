import type { CachePort } from "./cache.port";
import { MemoryCacheAdapter } from "./memory-cache.adapter";
import { NamespacedCacheAdapter } from "./namespaced-cache.adapter";
import {
  getSharedRedisClient,
  getSharedRedisStatus,
  isSharedCacheEnabled,
} from "./shared-redis";
import { RedisCacheAdapter } from "./redis-cache.adapter";
import { emitCacheMetricEvent } from "./cache-metrics";

const memoryFallback = new NamespacedCacheAdapter(new MemoryCacheAdapter());

class DynamicServerCache implements CachePort {
  async getJson<T>(key: string): Promise<T | null> {
    if (!isSharedCacheEnabled()) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "get",
        outcome: "fallback",
        context: key,
        metadata: { backend: "memory", reason: "cache-disabled" },
      });
      return memoryFallback.getJson<T>(key);
    }

    const redis = getSharedRedisClient();
    if (!redis) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "get",
        outcome: "fallback",
        context: key,
        metadata: { backend: "memory" },
      });
      return memoryFallback.getJson<T>(key);
    }

    return new NamespacedCacheAdapter(new RedisCacheAdapter(redis)).getJson<T>(key);
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!isSharedCacheEnabled()) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "set",
        outcome: "fallback",
        context: key,
        metadata: { backend: "memory", reason: "cache-disabled", ttlSeconds },
      });
      await memoryFallback.setJson(key, value, ttlSeconds);
      return;
    }

    const redis = getSharedRedisClient();
    if (!redis) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "set",
        outcome: "fallback",
        context: key,
        metadata: { backend: "memory", ttlSeconds },
      });
      await memoryFallback.setJson(key, value, ttlSeconds);
      return;
    }

    await new NamespacedCacheAdapter(new RedisCacheAdapter(redis)).setJson(
      key,
      value,
      ttlSeconds,
    );
  }

  async delete(key: string): Promise<void> {
    if (!isSharedCacheEnabled()) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "delete",
        outcome: "fallback",
        context: key,
        metadata: { backend: "memory", reason: "cache-disabled" },
      });
      await memoryFallback.delete(key);
      return;
    }

    const redis = getSharedRedisClient();
    if (!redis) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "delete",
        outcome: "fallback",
        context: key,
        metadata: { backend: "memory" },
      });
      await memoryFallback.delete(key);
      return;
    }

    await new NamespacedCacheAdapter(new RedisCacheAdapter(redis)).delete(key);
  }
}

const cache = new DynamicServerCache();

export function createServerCache(): CachePort {
  return cache;
}

export function getServerCacheStatus() {
  return getSharedRedisStatus();
}
