import { NextRequest, NextResponse } from "next/server";
import { createAdminDomain, isAdminError, AdminError } from "@/domain/admin";
import { checkRateLimit } from "@/lib/admin/rate-limiter";

export const dynamic = "force-dynamic";

interface AdminRouteDeps {
  getSession: (
    request: NextRequest,
  ) => Promise<{ user?: { id?: string; role?: string } } | null>;
  createDomain: typeof createAdminDomain;
}

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const parsePagination = (request: NextRequest) => ({
  page: parsePositiveInt(request.nextUrl.searchParams.get("page"), 1),
  limit: parsePositiveInt(request.nextUrl.searchParams.get("limit"), 20),
});

const safeJson = async <T>(request: NextRequest): Promise<T | undefined> => {
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
};

const rateLimitPath = (path: string[], method: string) => {
  const base = "/api/admin/" + (path.length > 0 ? path.join("/") : "root");
  return method === "GET" ? base : base;
};

const enforceRateLimit = (identifier: string, path: string) => {
  const result = checkRateLimit(identifier, path);
  if (!result.allowed) {
    throw new AdminError("RATE_LIMITED", 429, "Too many requests. Please wait before retrying.");
  }
};

const errorResponse = (error: unknown) => {
  if (isAdminError(error)) {
    return NextResponse.json(
      {
        status: "error",
        code: error.code,
        message: error.message,
        ...(error.details ? { data: error.details } : {}),
      },
      { status: error.statusCode },
    );
  }

  console.error("[api/admin] Unhandled error:", error);
  return NextResponse.json(
    { status: "error", code: "INTERNAL_ERROR", message: "Internal server error" },
    { status: 500 },
  );
};

const resolveAdmin = async (
  deps: AdminRouteDeps,
  request: NextRequest,
  path: string[] = [],
  method: string = "GET",
): Promise<{ userId: string; role: "admin"; ipAddress?: string; userAgent?: string }> => {
  const session = await deps.getSession(request);

  if (!session?.user?.id) {
    throw new AdminError("ADMIN_SESSION_EXPIRED", 401, "Authentication required");
  }

  const role = session.user.role;
  if (role !== "admin") {
    throw new AdminError("ADMIN_UNAUTHORIZED", 403, "Admin role required");
  }

  enforceRateLimit(session.user.id, rateLimitPath(path, method));

  return {
    userId: session.user.id,
    role,
    ipAddress: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  };
};

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

export const createAdminRouteHandlers = (deps: AdminRouteDeps) => {
  const GET = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const admin = await resolveAdmin(deps, request);
      const domain = deps.createDomain();

      // /api/admin/stats
      if (path.length === 1 && path[0] === "stats") {
        const stats = await domain.stats.getOverview();
        return NextResponse.json({ status: "success", data: stats });
      }

      // /api/admin/users
      if (path.length === 1 && path[0] === "users") {
        const pagination = parsePagination(request);
        const result = await domain.users.list({
          ...pagination,
          search: request.nextUrl.searchParams.get("search") ?? undefined,
          role: request.nextUrl.searchParams.get("role") ?? undefined,
          isBlocked: request.nextUrl.searchParams.get("isBlocked") === "true"
            ? true
            : request.nextUrl.searchParams.get("isBlocked") === "false"
              ? false
              : undefined,
        });
        return NextResponse.json({ status: "success", ...result });
      }

      // /api/admin/users/:id
      if (path.length === 2 && path[0] === "users") {
        const user = await domain.users.getById(path[1]);
        return NextResponse.json({ status: "success", data: user });
      }

      // /api/admin/courses
      if (path.length === 1 && path[0] === "courses") {
        const pagination = parsePagination(request);
        const result = await domain.courses.list({
          ...pagination,
          search: request.nextUrl.searchParams.get("search") ?? undefined,
          status: request.nextUrl.searchParams.get("status") ?? undefined,
          category: request.nextUrl.searchParams.get("category") ?? undefined,
        });
        return NextResponse.json({ status: "success", ...result });
      }

      // /api/admin/courses/:id
      if (path.length === 2 && path[0] === "courses") {
        const course = await domain.courses.getById(path[1]);
        return NextResponse.json({ status: "success", data: course });
      }

      // /api/admin/courses/:courseId/lessons
      if (path.length === 3 && path[0] === "courses" && path[2] === "lessons") {
        const lessons = await domain.lessons.list(path[1]);
        return NextResponse.json({ status: "success", data: lessons });
      }

      // /api/admin/lessons/:id
      if (path.length === 2 && path[0] === "lessons") {
        const lesson = await domain.lessons.getById(path[1]);
        return NextResponse.json({ status: "success", data: lesson });
      }

      // /api/admin/subscriptions
      if (path.length === 1 && path[0] === "subscriptions") {
        const pagination = parsePagination(request);
        const result = await domain.subscriptions.list({
          ...pagination,
          status: request.nextUrl.searchParams.get("status") ?? undefined,
          courseId: request.nextUrl.searchParams.get("courseId") ?? undefined,
        });
        return NextResponse.json({ status: "success", ...result });
      }

      // /api/admin/subscriptions/:id
      if (path.length === 2 && path[0] === "subscriptions") {
        const sub = await domain.subscriptions.getById(path[1]);
        return NextResponse.json({ status: "success", data: sub });
      }

      // /api/admin/inquiries
      if (path.length === 1 && path[0] === "inquiries") {
        const pagination = parsePagination(request);
        const result = await domain.inquiries.list({
          ...pagination,
          status: request.nextUrl.searchParams.get("status") ?? undefined,
          search: request.nextUrl.searchParams.get("search") ?? undefined,
        });
        return NextResponse.json({ status: "success", ...result });
      }

      // /api/admin/inquiries/:id
      if (path.length === 2 && path[0] === "inquiries") {
        const inquiry = await domain.inquiries.getById(path[1]);
        return NextResponse.json({ status: "success", data: inquiry });
      }

      // /api/admin/reports/:type
      if (path.length === 2 && path[0] === "reports") {
        const from = request.nextUrl.searchParams.get("from");
        const to = request.nextUrl.searchParams.get("to");
        if (!from || !to) {
          throw new AdminError("VALIDATION_ERROR", 422, "from and to query params required");
        }
        const range = { from, to };
        const report =
          path[1] === "revenue"
            ? await domain.reports.revenue(range)
            : path[1] === "users"
              ? await domain.reports.users(range)
              : path[1] === "courses"
                ? await domain.reports.courses(range)
                : null;
        if (!report) {
          throw new AdminError("RESOURCE_NOT_FOUND", 404, "Report type not found");
        }
        return NextResponse.json({ status: "success", data: report });
      }

      return NextResponse.json(
        { status: "error", code: "NOT_FOUND", message: "Route not found" },
        { status: 404 },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };

  const POST = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const admin = await resolveAdmin(deps, request);
      const domain = deps.createDomain();
      const body = await safeJson<Record<string, unknown>>(request);

      // /api/admin/courses (create)
      if (path.length === 1 && path[0] === "courses") {
        const course = await domain.courses.create(admin, body ?? {});
        return NextResponse.json({ status: "success", data: course }, { status: 201 });
      }

      // /api/admin/courses/:id/enroll
      if (path.length === 3 && path[0] === "courses" && path[2] === "enroll") {
        await domain.courses.enrollUser(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: null });
      }

      // /api/admin/users/:id/block
      if (path.length === 3 && path[0] === "users" && path[2] === "block") {
        const user = await domain.users.block(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: user });
      }

      // /api/admin/users/:id/unblock
      if (path.length === 3 && path[0] === "users" && path[2] === "unblock") {
        const user = await domain.users.unblock(admin, path[1]);
        return NextResponse.json({ status: "success", data: user });
      }

      // /api/admin/lessons (create — requires courseId in body)
      if (path.length === 1 && path[0] === "lessons") {
        const { courseId, ...lessonData } = (body ?? {}) as Record<string, unknown>;
        if (!courseId) {
          throw new AdminError("VALIDATION_ERROR", 422, "courseId is required");
        }
        const lesson = await domain.lessons.create(admin, String(courseId), lessonData);
        return NextResponse.json({ status: "success", data: lesson }, { status: 201 });
      }

      // /api/admin/courses/:courseId/lessons (create)
      if (path.length === 3 && path[0] === "courses" && path[2] === "lessons") {
        const lesson = await domain.lessons.create(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: lesson }, { status: 201 });
      }

      return NextResponse.json(
        { status: "error", code: "NOT_FOUND", message: "Route not found" },
        { status: 404 },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };

  const PUT = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const admin = await resolveAdmin(deps, request);
      const domain = deps.createDomain();
      const body = await safeJson<Record<string, unknown>>(request);

      // /api/admin/courses/:id (update)
      if (path.length === 2 && path[0] === "courses") {
        const course = await domain.courses.update(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: course });
      }

      // /api/admin/lessons/:id (update)
      if (path.length === 2 && path[0] === "lessons") {
        const lesson = await domain.lessons.update(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: lesson });
      }

      // /api/admin/users/:id (update)
      if (path.length === 2 && path[0] === "users") {
        const user = await domain.users.update(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: user });
      }

      // /api/admin/users/:id/role
      if (path.length === 3 && path[0] === "users" && path[2] === "role") {
        const user = await domain.users.setRole(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: user });
      }

      // /api/admin/subscriptions/:id
      if (path.length === 2 && path[0] === "subscriptions") {
        const sub = await domain.subscriptions.update(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: sub });
      }

      // /api/admin/inquiries/:id/status
      if (path.length === 3 && path[0] === "inquiries" && path[2] === "status") {
        const inquiry = await domain.inquiries.updateStatus(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: inquiry });
      }

      // /api/admin/courses/:courseId/lessons/reorder
      if (path.length === 4 && path[0] === "courses" && path[2] === "lessons" && path[3] === "reorder") {
        const lessons = await domain.lessons.reorder(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: lessons });
      }

      return NextResponse.json(
        { status: "error", code: "NOT_FOUND", message: "Route not found" },
        { status: 404 },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };

  const PATCH = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const admin = await resolveAdmin(deps, request);
      const domain = deps.createDomain();
      const body = await safeJson<Record<string, unknown>>(request);

      // /api/admin/courses/:id/status
      if (path.length === 3 && path[0] === "courses" && path[2] === "status") {
        const course = await domain.courses.updateStatus(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: course });
      }

      // /api/admin/lessons/:id/visibility
      if (path.length === 3 && path[0] === "lessons" && path[2] === "visibility") {
        const lesson = await domain.lessons.toggleVisibility(admin, path[1]);
        return NextResponse.json({ status: "success", data: lesson });
      }

      return NextResponse.json(
        { status: "error", code: "NOT_FOUND", message: "Route not found" },
        { status: 404 },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };

  const DELETE = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const admin = await resolveAdmin(deps, request);
      const domain = deps.createDomain();

      // /api/admin/courses/:id (archive)
      if (path.length === 2 && path[0] === "courses") {
        await domain.courses.archive(admin, path[1]);
        return NextResponse.json({ status: "success", data: null });
      }

      // /api/admin/courses/:id/enroll (revoke)
      if (path.length === 3 && path[0] === "courses" && path[2] === "enroll") {
        const body = await safeJson<Record<string, unknown>>(request);
        await domain.courses.revokeUser(admin, path[1], body ?? {});
        return NextResponse.json({ status: "success", data: null });
      }

      // /api/admin/lessons/:id (archive)
      if (path.length === 2 && path[0] === "lessons") {
        await domain.lessons.archive(admin, path[1]);
        return NextResponse.json({ status: "success", data: null });
      }

      // /api/admin/users/:id (suspend)
      if (path.length === 2 && path[0] === "users") {
        await domain.users.suspend(admin, path[1]);
        return NextResponse.json({ status: "success", data: null });
      }

      return NextResponse.json(
        { status: "error", code: "NOT_FOUND", message: "Route not found" },
        { status: 404 },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };

  return { GET, POST, PUT, PATCH, DELETE };
};

const getSessionFromAuth = async (request: NextRequest) => {
  const { auth } = await import("@/lib/auth");
  return auth.api.getSession({ headers: request.headers }) as Promise<{ user?: { id?: string; role?: string } } | null>;
};

const routeHandlers = createAdminRouteHandlers({
  getSession: getSessionFromAuth,
  createDomain: createAdminDomain,
});

export async function GET(request: NextRequest, context: RouteContext) {
  return routeHandlers.GET(request, context);
}
export async function POST(request: NextRequest, context: RouteContext) {
  return routeHandlers.POST(request, context);
}
export async function PUT(request: NextRequest, context: RouteContext) {
  return routeHandlers.PUT(request, context);
}
export async function PATCH(request: NextRequest, context: RouteContext) {
  return routeHandlers.PATCH(request, context);
}
export async function DELETE(request: NextRequest, context: RouteContext) {
  return routeHandlers.DELETE(request, context);
}
