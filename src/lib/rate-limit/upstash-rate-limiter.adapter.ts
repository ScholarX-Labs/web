import { Ratelimit } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";
import type {
  DistributedRateLimiter,
  DistributedRateLimitRule,
  RateLimitDecision,
} from "./distributed-rate-limiter.port";
import { emitCacheMetricEvent } from "@/lib/cache/cache-metrics";
import { markSharedRedisHealthy } from "@/lib/cache/shared-redis";
import { buildRateLimitPrefix } from "./rate-limit.utils";

export class UpstashRateLimiterAdapter implements DistributedRateLimiter {
  private readonly limiters = new Map<string, Ratelimit>();

  constructor(private readonly redis: Redis) {}

  async check(
    rule: DistributedRateLimitRule,
    subject: string,
  ): Promise<RateLimitDecision> {
    const startedAt = Date.now();
    const limiter = this.getLimiter(rule);
    const result = await limiter.limit(subject);
    markSharedRedisHealthy(`rate-limit:${rule.id}`);

    if (result.success) {
      emitCacheMetricEvent({
        source: "rate-limit",
        operation: "check",
        outcome: "hit",
        durationMs: Date.now() - startedAt,
        context: rule.id,
        metadata: { allowed: true },
      });
      return {
        allowed: true,
        remaining: result.remaining,
        resetAt: result.reset,
        source: "redis",
      };
    }

    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: "miss",
      durationMs: Date.now() - startedAt,
      context: rule.id,
      metadata: { allowed: false },
    });
    return {
      allowed: false,
      remaining: 0,
      resetAt: result.reset,
      retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      source: "redis",
      reason: "limit_exceeded",
    };
  }

  private getLimiter(rule: DistributedRateLimitRule): Ratelimit {
    const existing = this.limiters.get(rule.id);
    if (existing) return existing;

    const limiter = new Ratelimit({
      redis: this.redis,
      prefix: buildRateLimitPrefix(rule.id),
      analytics: true,
      limiter: Ratelimit.slidingWindow(rule.maxRequests, `${rule.windowSeconds} s`),
    });

    this.limiters.set(rule.id, limiter);
    return limiter;
  }
}
