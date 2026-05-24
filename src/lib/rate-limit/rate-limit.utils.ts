import { createHash } from "node:crypto";
import { namespaceRedisKey } from "@/lib/cache/redis-key-namespace";

export function hashRateLimitSubject(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function buildRateLimitSubject(parts: Array<string | null | undefined>): string {
  return hashRateLimitSubject(parts.map((part) => part ?? "").join(":"));
}

export function buildRateLimitPrefix(ruleId: string): string {
  return namespaceRedisKey(`ratelimit:${ruleId}`);
}

export function createFallbackDecision(
  failureMode: "fail-open" | "fail-closed",
  windowSeconds: number,
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  source: "fallback";
  retryAfterSeconds?: number;
  reason?: "limiter_unavailable";
} {
  const resetAt = Date.now() + windowSeconds * 1000;

  if (failureMode === "fail-open") {
    return {
      allowed: true,
      remaining: Number.MAX_SAFE_INTEGER,
      resetAt,
      source: "fallback",
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt,
    retryAfterSeconds: windowSeconds,
    source: "fallback",
    reason: "limiter_unavailable",
  };
}
