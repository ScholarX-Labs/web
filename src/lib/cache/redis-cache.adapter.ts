import type { Cluster, Redis } from "ioredis";
import type { CachePort } from "./cache.port";
import { emitCacheMetricEvent } from "./cache-metrics";
import { markSharedRedisHealthy } from "./shared-redis";

export type RedisClient = Redis | Cluster;

export class RedisCacheAdapter implements CachePort {
  constructor(private readonly redis: RedisClient) {}

  async getJson<T>(key: string): Promise<T | null> {
    const startedAt = Date.now();
    const result = await this.redis.get(key);
    markSharedRedisHealthy(`cache:get:${key}`);

    if (typeof result !== "string") {
      emitCacheMetricEvent({
        source: "cache",
        operation: "get",
        outcome: "miss",
        durationMs: Date.now() - startedAt,
        context: key,
      });
      return null;
    }

    emitCacheMetricEvent({
      source: "cache",
      operation: "get",
      outcome: "hit",
      durationMs: Date.now() - startedAt,
      context: key,
    });
    return JSON.parse(result) as T;
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const startedAt = Date.now();
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    markSharedRedisHealthy(`cache:set:${key}`);
    emitCacheMetricEvent({
      source: "cache",
      operation: "set",
      outcome: "set",
      durationMs: Date.now() - startedAt,
      context: key,
      metadata: { ttlSeconds },
    });
  }

  async delete(key: string): Promise<void> {
    const startedAt = Date.now();
    await this.redis.del(key);
    markSharedRedisHealthy(`cache:delete:${key}`);
    emitCacheMetricEvent({
      source: "cache",
      operation: "delete",
      outcome: "delete",
      durationMs: Date.now() - startedAt,
      context: key,
    });
  }
}
