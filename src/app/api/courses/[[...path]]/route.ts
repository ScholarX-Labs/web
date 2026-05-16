import { NextRequest } from "next/server";
import { createNextCourseDomain } from "@/domain/courses";
import {
  createCoursesRouteHandlers,
  type RouteContext,
} from "./route-handlers";

export const dynamic = "force-dynamic";

const getSessionFromAuth = async (request: NextRequest) => {
  const { auth } = await import("@/lib/auth");
  return auth.api.getSession({ headers: request.headers });
};

const routeHandlers = createCoursesRouteHandlers({
  getSession: getSessionFromAuth,
  createDomain: createNextCourseDomain,
});

export async function GET(request: NextRequest, context: RouteContext) {
  return routeHandlers.GET(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return routeHandlers.POST(request, context);
}
