import { randomUUID } from "node:crypto";
import type { RedisClient } from "@/lib/cache/redis-cache.adapter";
import { emitCacheMetricEvent } from "@/lib/cache/cache-metrics";
import { markSharedRedisHealthy } from "@/lib/cache/shared-redis";
import type {
  DistributedRateLimiter,
  DistributedRateLimitRule,
  RateLimitDecision,
} from "./distributed-rate-limiter.port";
import { buildRateLimitPrefix } from "./rate-limit.utils";

const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local member = ARGV[4]

redis.call("ZREMRANGEBYSCORE", key, 0, now - window)
local current = redis.call("ZCARD", key)

if current < max_requests then
  redis.call("ZADD", key, now, member)
  redis.call("PEXPIRE", key, window)
  return {1, max_requests - current - 1, now + window}
end

local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
local reset_at = now + window
if oldest[2] then
  reset_at = tonumber(oldest[2]) + window
end

redis.call("PEXPIRE", key, math.max(1, reset_at - now))
return {0, 0, reset_at}
`;

export class RedisSlidingWindowRateLimiterAdapter
  implements DistributedRateLimiter
{
  constructor(private readonly redis: RedisClient) {}

  async check(
    rule: DistributedRateLimitRule,
    subject: string,
  ): Promise<RateLimitDecision> {
    const startedAt = Date.now();
    const now = Date.now();
    const windowMs = rule.windowSeconds * 1000;
    const key = `${buildRateLimitPrefix(rule.id)}:${subject}`;

    const result = await this.redis.eval(
      SLIDING_WINDOW_SCRIPT,
      1,
      key,
      now.toString(),
      windowMs.toString(),
      rule.maxRequests.toString(),
      `${now}:${randomUUID()}`,
    );

    const [allowedRaw, remainingRaw, resetRaw] = parseRateLimitResult(result);
    markSharedRedisHealthy(`rate-limit:${rule.id}`);

    const allowed = allowedRaw === 1;
    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: allowed ? "hit" : "miss",
      durationMs: Date.now() - startedAt,
      context: rule.id,
      metadata: { allowed },
    });

    if (allowed) {
      return {
        allowed: true,
        remaining: remainingRaw,
        resetAt: resetRaw,
        source: "redis",
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt: resetRaw,
      retryAfterSeconds: Math.max(1, Math.ceil((resetRaw - Date.now()) / 1000)),
      source: "redis",
      reason: "limit_exceeded",
    };
  }
}

function parseRateLimitResult(result: unknown): [number, number, number] {
  if (!Array.isArray(result) || result.length < 3) {
    throw new Error("Invalid Redis rate-limit response");
  }

  const parsed = result.map((value) => Number(value));
  if (parsed.some((value) => !Number.isFinite(value))) {
    throw new Error("Invalid Redis rate-limit response values");
  }

  return [parsed[0], parsed[1], parsed[2]];
}
