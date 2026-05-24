import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { getServerCacheStatus } from "@/lib/cache/cache.factory";
import { isSharedRedisConfigured } from "@/lib/cache/shared-redis";
import { checkDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { buildRateLimitSubject } from "@/lib/rate-limit/rate-limit.utils";

export interface AdminCacheStatusRouteDeps {
  requireAdmin: () => Promise<boolean>;
  getCacheStatus: typeof getServerCacheStatus;
  checkRateLimit: typeof checkDistributedRateLimit;
}

export function createAdminCacheStatusRouteHandlers(
  deps: AdminCacheStatusRouteDeps,
) {
  const GET = async (request: NextRequest) => {
    const authorized = await deps.requireAdmin();
    if (!authorized) return adminError();

    const callerIp =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const rateLimit = await deps.checkRateLimit(
      {
        id: "admin.cache-status.ip.minute",
        windowSeconds: 60,
        maxRequests: 30,
        failureMode: "fail-closed",
      },
      buildRateLimitSubject(["admin-cache-status", callerIp]),
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
            retryAfterSeconds: Math.max(
              1,
              Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
            ),
          },
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        generatedAt: new Date().toISOString(),
        flags: {
          cacheEnabled: env.CACHE_ENABLED !== "false",
          distributedRateLimitsEnabled:
            env.DISTRIBUTED_RATE_LIMITS_ENABLED !== "false",
          redisConfigured: isSharedRedisConfigured(),
        },
        redis: deps.getCacheStatus(),
      },
    });
  };

  return { GET };
}

function adminError() {
  return NextResponse.json(
    {
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Admin access is required" },
    },
    { status: 401 },
  );
}
