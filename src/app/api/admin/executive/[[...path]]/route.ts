import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/admin/rate-limiter";
import { createExecutiveDomain } from "@/domain/executive";
import { getExecutiveFlags } from "@/lib/executive/feature-flags";
import { createExecutiveRouteHandlers } from "../route-handlers";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const handlers = createExecutiveRouteHandlers({
  getFlags: getExecutiveFlags,
  getSession: (request: NextRequest) =>
    auth.api.getSession({ headers: request.headers }),
  checkRateLimit,
  createDomain: createExecutiveDomain,
});

export async function GET(request: NextRequest, context: RouteContext) {
  return handlers.GET(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handlers.PATCH(request, context);
}
