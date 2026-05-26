import { NextRequest, NextResponse } from "next/server";
import {
  actionCenterUpdateSchema,
  executivePageQuerySchema,
} from "@/domain/executive/contracts/executive-query.schemas";
import { createActionCenterService } from "@/domain/executive/application/action-center.service";
import type { ExecutiveDomain } from "@/domain/executive";
import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";

export type ExecutiveSession = {
  user?: {
    id?: string;
    role?: string | null;
  };
} | null;

export type ExecutiveRateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type ExecutiveRouteDeps = {
  getFlags: () => ExecutiveFeatureFlags;
  getSession: (request: NextRequest) => Promise<ExecutiveSession>;
  checkRateLimit: (
    identifier: string,
    path: string,
  ) => Promise<ExecutiveRateLimitResult>;
  createDomain: () => ExecutiveDomain;
};

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const routePageMap = {
  overview: "overview",
  users: "users",
  "courses-lessons": "courses_lessons",
  "learner-progress": "learner_progress",
  "opportunities-ai": "opportunities_ai",
  "technical-health": "technical_health",
  "action-center": "action_center",
  "public-growth": "public_growth",
  "team-operations": "team_operations",
  finance: "finance",
} as const satisfies Record<string, ExecutivePageId>;

function jsonError(
  code: string,
  message: string,
  status: number,
  data?: unknown,
): NextResponse {
  return NextResponse.json(
    {
      status: "error",
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
    { status },
  );
}

function firstPathSegment(path: string[]): string | null {
  return path[0] ?? null;
}

function resolvePageId(path: string[]): ExecutivePageId | null {
  const segment = firstPathSegment(path);
  if (!segment) return null;
  return routePageMap[segment as keyof typeof routePageMap] ?? null;
}

function isPageEnabled(
  pageId: ExecutivePageId,
  flags: ExecutiveFeatureFlags,
): boolean {
  if (!flags.EXECUTIVE_DASHBOARD_ENABLED) return false;
  if (pageId === "team_operations") return flags.EXECUTIVE_TEAM_OPERATIONS_ENABLED;
  if (pageId === "finance") return flags.EXECUTIVE_FINANCE_ENABLED;
  return true;
}

async function resolveAdmin(
  deps: ExecutiveRouteDeps,
  request: NextRequest,
  path: string[],
): Promise<{ userId: string; role: "admin" }> {
  const session = await deps.getSession(request);
  if (!session?.user?.id) {
    throw jsonError("ADMIN_SESSION_EXPIRED", "Authentication required", 401);
  }
  if (session.user.role !== "admin") {
    throw jsonError("ADMIN_UNAUTHORIZED", "Admin role required", 403);
  }

  const rateLimit = await deps.checkRateLimit(
    session.user.id,
    "/api/admin/executive/" + path.join("/"),
  );
  if (!rateLimit.allowed) {
    throw jsonError("RATE_LIMITED", "Too many requests", 429, {
      resetAt: rateLimit.resetAt,
      remaining: rateLimit.remaining,
    });
  }

  return { userId: session.user.id, role: "admin" };
}

function queryFromRequest(request: NextRequest): Record<string, string> {
  return Object.fromEntries(request.nextUrl.searchParams.entries());
}

async function readPage(
  domain: ExecutiveDomain,
  pageId: ExecutivePageId,
  query: ReturnType<typeof executivePageQuerySchema.parse>,
  path: string[],
) {
  switch (pageId) {
    case "overview":
      return domain.repositories.read.getOverview(query);
    case "users":
      return domain.repositories.read.getUsers(query);
    case "courses_lessons":
      if (path.length >= 3 && path[2] === "lessons" && path[1]) {
        return domain.repositories.read.getLessonDrilldown(query, path[1]);
      }
      return domain.repositories.read.getCoursesLessons(query);
    case "learner_progress":
      return domain.repositories.read.getLearnerProgress(query);
    case "opportunities_ai":
      return domain.repositories.read.getOpportunitiesAi(query);
    case "technical_health":
      return domain.repositories.read.getTechnicalHealth(query);
    case "action_center":
      return createActionCenterService(domain.repositories.actionCenter).getActionCenter(query);
    case "public_growth":
      return domain.repositories.read.getPublicGrowth(query);
    case "team_operations":
      return domain.repositories.read.getTeamOperations(query);
    case "finance":
      return domain.repositories.read.getFinance(query);
  }
}

export function createExecutiveRouteHandlers(deps: ExecutiveRouteDeps) {
  const GET = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const pageId = resolvePageId(path);
      if (!pageId) {
        return jsonError("NOT_FOUND", "Route not found", 404);
      }

      const flags = deps.getFlags();
      if (!isPageEnabled(pageId, flags)) {
        return jsonError("NOT_FOUND", "Route not found", 404);
      }

      await resolveAdmin(deps, request, path);

      const parsed = executivePageQuerySchema.safeParse(queryFromRequest(request));
      if (!parsed.success) {
        return jsonError("VALIDATION_ERROR", "Validation failed", 422, {
          fieldErrors: parsed.error.issues,
        });
      }

      const data = await readPage(deps.createDomain(), pageId, parsed.data, path);
      return NextResponse.json({ status: "success", data });
    } catch (error) {
      if (error instanceof NextResponse) return error;
      console.error("[api/admin/executive] Unhandled error:", error);
      return jsonError("INTERNAL_ERROR", "Internal server error", 500);
    }
  };

  const PATCH = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const pageId = resolvePageId(path);
      if (pageId !== "action_center" || !path[1]) {
        return jsonError("NOT_FOUND", "Route not found", 404);
      }

      const flags = deps.getFlags();
      if (!isPageEnabled(pageId, flags)) {
        return jsonError("NOT_FOUND", "Route not found", 404);
      }

      const admin = await resolveAdmin(deps, request, path);
      const parsed = actionCenterUpdateSchema.safeParse(await request.json());
      if (!parsed.success) {
        return jsonError("VALIDATION_ERROR", "Validation failed", 422, {
          fieldErrors: parsed.error.issues,
        });
      }

      const item = await deps.createDomain().repositories.actionCenter.updateWorkflowState(
        {
          userId: admin.userId,
          ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
        path[1],
        parsed.data,
      );
      return NextResponse.json({ status: "success", data: item });
    } catch (error) {
      if (error instanceof NextResponse) return error;
      if (error instanceof SyntaxError) {
        return jsonError("VALIDATION_ERROR", "Invalid JSON body", 422);
      }
      console.error("[api/admin/executive] Unhandled PATCH error:", error);
      return jsonError("INTERNAL_ERROR", "Internal server error", 500);
    }
  };

  return { GET, PATCH };
}
