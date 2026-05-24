import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getServerCacheStatus } from "@/lib/cache/cache.factory";
import { checkDistributedRateLimit } from "@/lib/rate-limit/rate-limit.factory";
import { createAdminCacheStatusRouteHandlers } from "./route-handlers";

export const dynamic = "force-dynamic";

const routeHandlers = createAdminCacheStatusRouteHandlers({
  requireAdmin,
  getCacheStatus: getServerCacheStatus,
  checkRateLimit: checkDistributedRateLimit,
});

export async function GET(request: NextRequest) {
  return routeHandlers.GET(request);
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role === "admin";
}
