import { checkDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { buildRateLimitSubject } from "@/lib/rate-limit/rate-limit.utils";

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = { windowMs: 60_000, maxRequests: 100 };
const ROUTE_LIMITS = new Map<string, RateLimitConfig>([
  ["/api/admin/stats", { windowMs: 60_000, maxRequests: 30 }],
  ["/api/admin/reports", { windowMs: 60_000, maxRequests: 20 }],
  ["/api/admin/*/enroll", { windowMs: 60_000, maxRequests: 10 }],
]);

const getRouteConfig = (path: string): RateLimitConfig => {
  for (const [pattern, config] of ROUTE_LIMITS) {
    const regex = new RegExp("^" + pattern.replace(/\*/g, "[^/]+") + "$");
    if (regex.test(path)) return config;
  }
  return DEFAULT_CONFIG;
};

export const checkRateLimit = async (
  identifier: string,
  path: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
  const config = getRouteConfig(path);
  const result = await checkDistributedRateLimit(
    {
      id: `admin.api.${path.replace(/[^a-z0-9]+/gi, ".").replace(/^\.+|\.+$/g, "").toLowerCase() || "root"}`,
      windowSeconds: Math.ceil(config.windowMs / 1000),
      maxRequests: config.maxRequests,
      failureMode: "fail-open",
    },
    buildRateLimitSubject(["admin", identifier, path]),
  );

  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
};
