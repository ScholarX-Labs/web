import { randomUUID } from "node:crypto";
import { emitCacheMetricEvent } from "@/lib/cache/cache-metrics";
import { markSharedRedisHealthy } from "@/lib/cache/shared-redis";
import { getUpstashRedis } from "@/lib/cache/upstash-redis";
import type {
  DistributedRateLimiter,
  DistributedRateLimitRule,
  RateLimitDecision,
} from "./distributed-rate-limiter.port";
import { buildRateLimitPrefix } from "./rate-limit.utils";

/**
 * Sliding-window rate limiter backed by the Upstash Redis REST client.
 *
 * Upstash supports Lua EVAL, so the same atomic sliding-window scripts used
 * by RedisSlidingWindowRateLimiterAdapter are reused verbatim. Atomicity and
 * correctness guarantees are identical.
 *
 * The REST client does not maintain a persistent TCP connection — each EVAL
 * is an HTTPS request to the Upstash REST endpoint. This is correct for
 * serverless (Vercel) environments where persistent sockets are unavailable.
 */
export class UpstashSlidingWindowRateLimiterAdapter implements DistributedRateLimiter {
  /**
   * Atomically check AND increment — spends a rate-limit slot.
   * Use this only after a successful operation to avoid penalising failed attempts.
   */
  async check(
    rule: DistributedRateLimitRule,
    subject: string,
  ): Promise<RateLimitDecision> {
    const startedAt = Date.now();
    const now = Date.now();
    const windowMs = rule.windowSeconds * 1000;
    const key = `${buildRateLimitPrefix(rule.id)}:${subject}`;

    const client = getUpstashRedis();
    if (!client) {
      return buildFallbackDecision(rule, "limiter_unavailable");
    }

    const result = await client.eval(
      SLIDING_WINDOW_SCRIPT,
      [key],
      [now.toString(), windowMs.toString(), rule.maxRequests.toString(), `${now}:${randomUUID()}`],
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
      return { allowed: true, remaining: remainingRaw, resetAt: resetRaw, source: "redis" };
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

  /**
   * Read-only budget check — does NOT increment the counter.
   * Use this to gate a request before the work begins; call check() after success.
   */
  async peek(
    rule: DistributedRateLimitRule,
    subject: string,
  ): Promise<RateLimitDecision> {
    const startedAt = Date.now();
    const now = Date.now();
    const windowMs = rule.windowSeconds * 1000;
    const key = `${buildRateLimitPrefix(rule.id)}:${subject}`;

    const client = getUpstashRedis();
    if (!client) {
      return buildFallbackDecision(rule, "limiter_unavailable");
    }

    const result = await client.eval(
      PEEK_SCRIPT,
      [key],
      [now.toString(), windowMs.toString(), rule.maxRequests.toString()],
    );

    const [allowedRaw, remainingRaw, resetRaw] = parseRateLimitResult(result);
    markSharedRedisHealthy(`rate-limit:${rule.id}`);

    const allowed = allowedRaw === 1;
    emitCacheMetricEvent({
      source: "rate-limit",
      operation: "check",
      outcome: allowed ? "hit" : "miss",
      durationMs: Date.now() - startedAt,
      context: `${rule.id}:peek`,
      metadata: { allowed },
    });

    if (allowed) {
      return { allowed: true, remaining: remainingRaw, resetAt: resetRaw, source: "redis" };
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

// ---------------------------------------------------------------------------
// Lua scripts — identical to those in RedisSlidingWindowRateLimiterAdapter.
// Upstash EVAL signature: eval(script, keys[], args[])
// ---------------------------------------------------------------------------

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

// Read-only: cleans expired entries then returns current count without adding a new one.
const PEEK_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])

redis.call("ZREMRANGEBYSCORE", key, 0, now - window)
local current = redis.call("ZCARD", key)

if current < max_requests then
  return {1, max_requests - current, now + window}
end

local oldest = redis.call("ZRANGE", key, 0, 0, "WITHSCORES")
local reset_at = now + window
if oldest[2] then
  reset_at = tonumber(oldest[2]) + window
end
return {0, 0, reset_at}
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseRateLimitResult(result: unknown): [number, number, number] {
  if (!Array.isArray(result) || result.length < 3) {
    throw new Error("Invalid Upstash rate-limit response");
  }
  const parsed = result.map((value) => Number(value));
  if (parsed.some((value) => !Number.isFinite(value))) {
    throw new Error("Invalid Upstash rate-limit response values");
  }
  return [parsed[0], parsed[1], parsed[2]];
}

function buildFallbackDecision(
  rule: DistributedRateLimitRule,
  reason: "limiter_unavailable",
): RateLimitDecision {
  const resetAt = Date.now() + rule.windowSeconds * 1000;
  if (rule.failureMode === "fail-open") {
    return { allowed: true, remaining: rule.maxRequests, resetAt, source: "fallback" };
  }
  return {
    allowed: false,
    remaining: 0,
    resetAt,
    retryAfterSeconds: rule.windowSeconds,
    source: "fallback",
    reason,
  };
}
