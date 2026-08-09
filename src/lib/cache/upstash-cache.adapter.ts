import type { CachePort } from "./cache.port";
import { emitCacheMetricEvent } from "./cache-metrics";
import { markSharedRedisHealthy, markSharedRedisUnavailable } from "./shared-redis";
import { getUpstashRedis } from "./upstash-redis";

/**
 * CachePort adapter backed by the Upstash Redis REST client.
 *
 * Mirrors the telemetry and circuit-breaker call pattern of RedisCacheAdapter
 * so the admin dashboard, metrics, and shared circuit state stay consistent
 * regardless of which Redis backend is active.
 *
 * The Upstash REST client is stateless (HTTP) — there is no `.status` to poll.
 * Availability is governed by the shared circuit-breaker (30 s cooldown) in
 * shared-redis.ts, which is tripped on any thrown error and reset on the next
 * successful operation.
 */
export class UpstashCacheAdapter implements CachePort {
  async getJson<T>(key: string): Promise<T | null> {
    const startedAt = Date.now();
    const client = getUpstashRedis();
    if (!client) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "get",
        outcome: "fallback",
        durationMs: Date.now() - startedAt,
        context: key,
        metadata: { reason: "upstash-not-configured", backend: "memory" },
      });
      return null;
    }

    try {
      // @upstash/redis returns the parsed value directly (JSON deserialized).
      // We store values as JSON strings (via setJson) so we receive a string here.
      const raw = await client.get<string>(key);
      markSharedRedisHealthy(`cache:get:${key}`);

      if (typeof raw !== "string") {
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
      return JSON.parse(raw) as T;
    } catch (error) {
      markSharedRedisUnavailable(`cache:get:${key}`, error);
      emitCacheMetricEvent({
        source: "cache",
        operation: "get",
        outcome: "error",
        durationMs: Date.now() - startedAt,
        context: key,
        metadata: errorMetadata(error),
      });
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const startedAt = Date.now();
    const client = getUpstashRedis();
    if (!client) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "set",
        outcome: "fallback",
        durationMs: Date.now() - startedAt,
        context: key,
        metadata: { reason: "upstash-not-configured", backend: "memory", ttlSeconds },
      });
      return;
    }

    try {
      // Store as a JSON string so getJson can reliably JSON.parse it.
      // Upstash SET with EX sets the TTL in seconds.
      await client.set(key, JSON.stringify(value), { ex: ttlSeconds });
      markSharedRedisHealthy(`cache:set:${key}`);
      emitCacheMetricEvent({
        source: "cache",
        operation: "set",
        outcome: "set",
        durationMs: Date.now() - startedAt,
        context: key,
        metadata: { ttlSeconds },
      });
    } catch (error) {
      markSharedRedisUnavailable(`cache:set:${key}`, error);
      emitCacheMetricEvent({
        source: "cache",
        operation: "set",
        outcome: "error",
        durationMs: Date.now() - startedAt,
        context: key,
        metadata: { ttlSeconds, ...errorMetadata(error) },
      });
    }
  }

  async delete(key: string): Promise<void> {
    const startedAt = Date.now();
    const client = getUpstashRedis();
    if (!client) {
      emitCacheMetricEvent({
        source: "cache",
        operation: "delete",
        outcome: "fallback",
        durationMs: Date.now() - startedAt,
        context: key,
        metadata: { reason: "upstash-not-configured", backend: "memory" },
      });
      return;
    }

    try {
      await client.del(key);
      markSharedRedisHealthy(`cache:delete:${key}`);
      emitCacheMetricEvent({
        source: "cache",
        operation: "delete",
        outcome: "delete",
        durationMs: Date.now() - startedAt,
        context: key,
      });
    } catch (error) {
      markSharedRedisUnavailable(`cache:delete:${key}`, error);
      emitCacheMetricEvent({
        source: "cache",
        operation: "delete",
        outcome: "error",
        durationMs: Date.now() - startedAt,
        context: key,
        metadata: errorMetadata(error),
      });
    }
  }
}

function errorMetadata(error: unknown): Record<string, string | number | boolean | null> {
  return {
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
  };
}
