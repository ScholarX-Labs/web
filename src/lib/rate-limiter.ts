import { checkDistributedRateLimit, peekDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { buildRateLimitSubject } from "@/lib/rate-limit/rate-limit.utils";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

const AVATAR_RULES = [
  // fail-closed: if Redis is unavailable the request is denied.
  // This is intentional — avatar uploads are storage-budget-sensitive and
  // must not bypass rate limits just because Redis is temporarily unreachable.
  { id: "avatar.upload.user.hour",  windowSeconds: 60 * 60,            maxRequests: 3,  failureMode: "fail-closed" as const },
  { id: "avatar.upload.user.day",   windowSeconds: 24 * 60 * 60,       maxRequests: 5,  failureMode: "fail-closed" as const },
  { id: "avatar.upload.user.week",  windowSeconds: 7 * 24 * 60 * 60,   maxRequests: 7,  failureMode: "fail-closed" as const },
  { id: "avatar.upload.user.month", windowSeconds: 30 * 24 * 60 * 60,  maxRequests: 10, failureMode: "fail-closed" as const },
];

/**
 * Read-only budget check — does NOT consume a rate-limit slot.
 * Call this at the start of the request to gate it cheaply.
 * Call consumeAvatarUploadSlot() after a successful upload to spend the slot.
 */
export async function peekAvatarUploadLimit(
  userId: string
): Promise<RateLimitResult> {
  const subject = buildRateLimitSubject(["avatar", userId]);

  const results = await Promise.all(
    AVATAR_RULES.map((rule) => peekDistributedRateLimit(rule, subject)),
  );

  const denied = results.find((r) => !r.allowed);
  if (denied && !denied.allowed) {
    return { allowed: false, remaining: 0, reset: denied.resetAt };
  }

  return {
    allowed: true,
    remaining: Math.min(...results.map((r) => r.remaining)),
    reset: Math.max(...results.map((r) => r.resetAt)),
  };
}

/**
 * Atomically consume one rate-limit slot across all windows.
 * Call this ONLY after a successful upload so failed attempts don't burn quota.
 */
export async function consumeAvatarUploadSlot(
  userId: string
): Promise<RateLimitResult> {
  const subject = buildRateLimitSubject(["avatar", userId]);

  const results = await Promise.all(
    AVATAR_RULES.map((rule) => checkDistributedRateLimit(rule, subject)),
  );

  const denied = results.find((r) => !r.allowed);
  if (denied && !denied.allowed) {
    return { allowed: false, remaining: 0, reset: denied.resetAt };
  }

  return {
    allowed: true,
    remaining: Math.min(...results.map((r) => r.remaining)),
    reset: Math.max(...results.map((r) => r.resetAt)),
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
