import { checkDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { buildRateLimitSubject } from "@/lib/rate-limit/rate-limit.utils";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export async function checkAvatarUploadLimit(
  userId: string
): Promise<RateLimitResult> {
  const subject = buildRateLimitSubject(["avatar", userId]);
  const rules = [
    { id: "avatar.upload.user.hour", windowSeconds: 60 * 60, maxRequests: 3, failureMode: "fail-closed" as const },
    { id: "avatar.upload.user.day", windowSeconds: 24 * 60 * 60, maxRequests: 5, failureMode: "fail-closed" as const },
    { id: "avatar.upload.user.week", windowSeconds: 7 * 24 * 60 * 60, maxRequests: 7, failureMode: "fail-closed" as const },
    { id: "avatar.upload.user.month", windowSeconds: 30 * 24 * 60 * 60, maxRequests: 10, failureMode: "fail-closed" as const },
  ];

  const results = await Promise.all(
    rules.map((rule) => checkDistributedRateLimit(rule, subject)),
  );

  const denied = results.find((result) => !result.allowed);
  if (denied && !denied.allowed) {
    return { allowed: false, remaining: 0, reset: denied.resetAt };
  }

  return {
    allowed: true,
    remaining: Math.min(...results.map((result) => result.remaining)),
    reset: Math.max(...results.map((result) => result.resetAt)),
  };
}

export async function checkPublicProfileLimit(
  ip: string
): Promise<RateLimitResult> {
  const result = await checkDistributedRateLimit(
    {
      id: "public.profile.ip.minute",
      windowSeconds: 60,
      maxRequests: 60,
      failureMode: "fail-open",
    },
    buildRateLimitSubject(["public-profile", ip]),
  );

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    reset: result.resetAt,
  };
}

export async function checkPublicOpportunitySearchLimit(
  ip: string,
): Promise<RateLimitResult> {
  const result = await checkDistributedRateLimit(
    {
      id: "public.opportunities.search.ip.minute",
      windowSeconds: 60,
      maxRequests: 45,
      failureMode: "fail-open",
    },
    buildRateLimitSubject(["public-opportunities-search", ip]),
  );

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    reset: result.resetAt,
  };
}

export async function checkPublicOpportunityDetailLimit(
  ip: string,
): Promise<RateLimitResult> {
  const result = await checkDistributedRateLimit(
    {
      id: "public.opportunities.detail.ip.minute",
      windowSeconds: 60,
      maxRequests: 90,
      failureMode: "fail-open",
    },
    buildRateLimitSubject(["public-opportunities-detail", ip]),
  );

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    reset: result.resetAt,
  };
}
