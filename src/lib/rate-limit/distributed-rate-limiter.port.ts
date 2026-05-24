export type RateLimitFailureMode = "fail-open" | "fail-closed";

export interface DistributedRateLimitRule {
  id: string;
  windowSeconds: number;
  maxRequests: number;
  failureMode: RateLimitFailureMode;
}

export type RateLimitDecision =
  | {
      allowed: true;
      remaining: number;
      resetAt: number;
      source: "redis" | "fallback";
    }
  | {
      allowed: false;
      remaining: 0;
      resetAt: number;
      retryAfterSeconds: number;
      source: "redis" | "fallback";
      reason: "limit_exceeded" | "limiter_unavailable";
    };

export interface DistributedRateLimiter {
  check(
    rule: DistributedRateLimitRule,
    subject: string,
  ): Promise<RateLimitDecision>;
}
