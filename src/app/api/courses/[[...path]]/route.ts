import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createNextCourseDomain,
  isNextCourseError,
  NextCourseError,
} from "@/domain/courses";
import type { CourseEnrollmentRequest } from "@/domain/courses";

export const dynamic = "force-dynamic";

const parsePositiveInt = (value: string | null, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const parseListQuery = (request: NextRequest) => ({
  page: parsePositiveInt(request.nextUrl.searchParams.get("page"), 1),
  limit: parsePositiveInt(request.nextUrl.searchParams.get("limit"), 3),
  category: request.nextUrl.searchParams.get("category") ?? undefined,
});

const parseSearchQuery = (request: NextRequest) => ({
  title: request.nextUrl.searchParams.get("title") ?? "",
  page: parsePositiveInt(request.nextUrl.searchParams.get("page"), 1),
  limit: parsePositiveInt(request.nextUrl.searchParams.get("limit"), 3),
});

const errorResponse = (error: unknown) => {
  if (isNextCourseError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          numericCode: error.numericCode,
          statusCode: error.statusCode,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        numericCode: 9999,
        statusCode: 500,
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
};

const getSessionFromAuth = async (request: NextRequest) => {
  const { auth } = await import("@/lib/auth");
  return auth.api.getSession({ headers: request.headers });
};

const safeJson = async <T>(request: NextRequest): Promise<T | undefined> => {
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
};

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

export interface CoursesRouteDeps {
  getSession: (
    request: NextRequest,
  ) => Promise<{ user?: { id?: string } } | null>;
  createDomain: typeof createNextCourseDomain;
}

export const createCoursesRouteHandlers = (deps: CoursesRouteDeps) => {
  const resolveSession = async (request: NextRequest) =>
    deps.getSession(request);

  const resolveUserId = async (request: NextRequest): Promise<string> => {
    const session = await resolveSession(request);
    const userId = session?.user?.id;

    if (!userId) {
      throw new NextCourseError(
        "UNAUTHORIZED",
        401,
        "Authentication required",
        9002,
      );
    }

    return userId;
  };

  const GET = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const domain = deps.createDomain();
      const session = await resolveSession(request);
      const userId = session?.user?.id;

      if (path.length === 0) {
        const result = await domain.catalog.list(
          parseListQuery(request),
          userId,
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 1 && path[0] === "featured") {
        const result = await domain.catalog.getFeatured(
          parseListQuery(request),
          userId,
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 1 && path[0] === "scholarx") {
        const result = await domain.catalog.getScholarX(
          parseListQuery(request),
          userId,
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 1 && path[0] === "search") {
        const result = await domain.catalog.search(parseSearchQuery(request));
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 2 && path[0] === "slug") {
        const result = await domain.catalog.getBySlug(path[1], userId);
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 2 && path[1] === "subscription-status") {
        const authUserId = await resolveUserId(request);
        const result = await domain.catalog.getEnrollmentStatus(
          path[0],
          authUserId,
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 1) {
        const result = await domain.catalog.getById(path[0], userId);
        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            numericCode: 9004,
            statusCode: 404,
            message: "Route not found",
          },
        },
        { status: 404 },
      );
    } catch (error) {
      console.error("[api/courses] GET handler error:", error);
      if (error instanceof Error && error.stack) console.error(error.stack);
      return errorResponse(error);
    }
  };

  const POST = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const domain = deps.createDomain();
      const userId = await resolveUserId(request);
      const body = await safeJson<CourseEnrollmentRequest>(request);
      const requestId = request.headers.get("x-request-id") ?? randomUUID();

      if (path.length === 2 && path[1] === "enroll") {
        const result = await domain.enrollment.enrollFree(
          path[0],
          userId,
          body,
          {
            requestId,
          },
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 3 && path[1] === "enroll" && path[2] === "free") {
        const result = await domain.enrollment.enrollFree(
          path[0],
          userId,
          body,
          {
            requestId,
          },
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (
        path.length === 4 &&
        path[1] === "enroll" &&
        path[2] === "paid" &&
        path[3] === "init"
      ) {
        const result = await domain.enrollment.initPaidEnrollment(
          path[0],
          userId,
          body,
          { requestId },
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (
        path.length === 4 &&
        path[1] === "enroll" &&
        path[2] === "application" &&
        path[3] === "init"
      ) {
        const result = await domain.enrollment.initApplicationEnrollment(
          path[0],
          userId,
          body,
          { requestId },
        );
        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            numericCode: 9004,
            statusCode: 404,
            message: "Route not found",
          },
        },
        { status: 404 },
      );
    } catch (error) {
      console.error("[api/courses] POST handler error:", error);
      if (error instanceof Error && error.stack) console.error(error.stack);
      return errorResponse(error);
    }
  };

  return { GET, POST };
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
