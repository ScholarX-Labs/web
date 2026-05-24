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
import { UpstashRateLimiterAdapter } from "./upstash-rate-limiter.adapter";
import { emitCacheMetricEvent } from "@/lib/cache/cache-metrics";

class FallbackDistributedRateLimiter implements DistributedRateLimiter {
  async check(
    rule: DistributedRateLimitRule,
    _subject: string,
  ): Promise<RateLimitDecision> {
    return createFallbackDecision(rule.failureMode, rule.windowSeconds) as RateLimitDecision;
  }
}

let adapter: DistributedRateLimiter | null = null;
const fallbackLimiter = new FallbackDistributedRateLimiter();

function getAdapter(): DistributedRateLimiter {
  if (env.DISTRIBUTED_RATE_LIMITS_ENABLED === "false") {
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
    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: "fallback",
      context: "shared-redis-unavailable",
    });
    return fallbackLimiter;
  }

  if (!adapter) {
    adapter = new UpstashRateLimiterAdapter(redis);
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
