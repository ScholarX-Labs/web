import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

let redis: Redis | null = null;
let avatarRateLimiters: Ratelimit[] | null = null;
let profileLimiter: Ratelimit | null = null;

const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;
let redisDown = false;
let redisDownSince = 0;

function isCircuitOpen(): boolean {
  if (!redisDown) return false;
  if (Date.now() - redisDownSince >= CIRCUIT_BREAKER_COOLDOWN_MS) {
    redisDown = false;
    return false;
  }
  return true;
}

function markRedisDown(): void {
  redisDown = true;
  redisDownSince = Date.now();
  redis = null;
  avatarRateLimiters = null;
  profileLimiter = null;
  console.error("[rate-limiter] Redis unreachable — circuit open for 30s");
}

function getRedis(): Redis | null {
  if (isCircuitOpen()) return null;
  if (!env.UPSTASH_REDIS_URL || !env.UPSTASH_REDIS_TOKEN) {
    return null;
  }
  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_URL,
      token: env.UPSTASH_REDIS_TOKEN,
    });
  }
  return redis;
}

const AVATAR_WINDOWS = [
  { window: 60 * 60 * 1000, max: 3 },
  { window: 24 * 60 * 60 * 1000, max: 5 },
  { window: 7 * 24 * 60 * 60 * 1000, max: 7 },
  { window: 30 * 24 * 60 * 60 * 1000, max: 10 },
] as const;

function getAvatarUploadLimiters(): Ratelimit[] | null {
  const r = getRedis();
  if (!r) return null;

  if (!avatarRateLimiters) {
    avatarRateLimiters = AVATAR_WINDOWS.map(
      (w, i) =>
        new Ratelimit({
          redis: r,
          prefix: `ratelimit:avatar:${i}`,
          analytics: true,
          limiter: Ratelimit.slidingWindow(w.max, `${w.window} ms`),
        })
    );
  }
  return avatarRateLimiters;
}

function getPublicProfileLimiter(): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  if (!profileLimiter) {
    profileLimiter = new Ratelimit({
      redis: r,
      prefix: "ratelimit:profile",
      analytics: true,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
    });
  }
  return profileLimiter;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export async function checkAvatarUploadLimit(
  userId: string
): Promise<RateLimitResult> {
  const limiters = getAvatarUploadLimiters();
  if (!limiters) {
    console.error("[rate-limiter] Avatar upload rate limiter unavailable — blocking upload");
    return { allowed: false, remaining: 0, reset: Date.now() + 60_000 };
  }

  try {
    const results = await Promise.all(limiters.map((l) => l.limit(userId)));

    const allowed = results.every((r) => r.success);
    const remaining = Math.min(...results.map((r) => r.remaining));
    const reset = Math.max(...results.map((r) => r.reset));

    return { allowed, remaining, reset };
  } catch (error) {
    console.error("[rate-limiter] Redis error during avatar check:", error);
    markRedisDown();
    return { allowed: false, remaining: 0, reset: Date.now() + 60_000 };
  }
}

export async function checkPublicProfileLimit(
  ip: string
): Promise<RateLimitResult> {
  const limiter = getPublicProfileLimiter();
  if (!limiter) {
    return { allowed: true, remaining: 999, reset: 0 };
  }

  try {
    const result = await limiter.limit(ip);
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("[rate-limiter] Redis error during profile check:", error);
    markRedisDown();
    return { allowed: true, remaining: 999, reset: 0 };
  }
}
