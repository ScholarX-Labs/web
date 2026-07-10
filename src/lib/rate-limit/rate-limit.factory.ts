import type {
  DistributedRateLimiter,
  DistributedRateLimitRule,
  RateLimitDecision,
} from "./distributed-rate-limiter.port";
import { createFallbackDecision } from "./rate-limit.utils";
import {
  getSharedRedisClient,
  markSharedRedisUnavailable,
} from "@/lib/cache/shared-redis";
import { env } from "@/config/env";
import type { RedisClient } from "@/lib/cache/redis-cache.adapter";
import { RedisSlidingWindowRateLimiterAdapter } from "./redis-sliding-window-rate-limiter.adapter";
import { emitCacheMetricEvent } from "@/lib/cache/cache-metrics";

class FallbackDistributedRateLimiter implements DistributedRateLimiter {
  async check(
    rule: DistributedRateLimitRule,
    subject: string,
  ): Promise<RateLimitDecision> {
    void subject;
    return createFallbackDecision(rule.failureMode, rule.windowSeconds) as RateLimitDecision;
  }

  // peek has the same fallback semantics as check
  async peek(
    rule: DistributedRateLimitRule,
    subject: string,
  ): Promise<RateLimitDecision> {
    return this.check(rule, subject);
  }
}

let adapter: DistributedRateLimiter | null = null;
let cachedRedis: RedisClient | null = null;
const fallbackLimiter = new FallbackDistributedRateLimiter();

function getAdapter(): DistributedRateLimiter {
  if (env.DISTRIBUTED_RATE_LIMITS_ENABLED === "false") {
    adapter = null;
    cachedRedis = null;
    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: "fallback",
      context: "distributed-rate-limits-disabled",
    });
    return fallbackLimiter;
  }

  const redis = getSharedRedisClient();
  if (!redis) {
    adapter = null;
    cachedRedis = null;
    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: "fallback",
      context: "shared-redis-unavailable",
    });
    return fallbackLimiter;
  }

  if (!adapter || redis !== cachedRedis) {
    adapter = new RedisSlidingWindowRateLimiterAdapter(redis);
    cachedRedis = redis;
  }

  return adapter;
}

export async function checkDistributedRateLimit(
  rule: DistributedRateLimitRule,
  subject: string,
): Promise<RateLimitDecision> {
  const limiter = getAdapter();

  try {
    return await limiter.check(rule, subject);
  } catch (error) {
    markSharedRedisUnavailable(`rate-limit:${rule.id}`, error);
    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: "error",
      context: rule.id,
      metadata: { failureMode: rule.failureMode },
    });
    return createFallbackDecision(rule.failureMode, rule.windowSeconds) as RateLimitDecision;
  }
}

/** Read-only check — does NOT increment the counter. */
export async function peekDistributedRateLimit(
  rule: DistributedRateLimitRule,
  subject: string,
): Promise<RateLimitDecision> {
  const limiter = getAdapter();

  try {
    return await limiter.peek(rule, subject);
  } catch (error) {
    markSharedRedisUnavailable(`rate-limit:${rule.id}`, error);
    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: "error",
      context: `${rule.id}:peek`,
      metadata: { failureMode: rule.failureMode },
    });
    return createFallbackDecision(rule.failureMode, rule.windowSeconds) as RateLimitDecision;
  }
}
