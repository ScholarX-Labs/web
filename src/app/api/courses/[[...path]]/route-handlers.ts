import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createNextCourseDomain,
  isNextCourseError,
  NextCourseError,
} from "@/domain/courses";
import type { CourseEnrollmentRequest } from "@/domain/courses";

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

const logUnexpectedError = (label: string, error: unknown) => {
  if (isNextCourseError(error)) return;

  console.error(label, error);
  if (error instanceof Error && error.stack) console.error(error.stack);
};

const safeJson = async <T>(request: NextRequest): Promise<T | undefined> => {
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
};

interface InquiryBody {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  sourceSurface?: string;
  idempotencyKey?: string;
}

interface ApplicationBody extends InquiryBody {
  age?: number;
  learnerStatus?: "high_school" | "undergraduate" | "graduate" | "professional";
  highSchoolName?: string;
  university?: string;
  faculty?: string;
  graduationYear?: number;
  workField?: string;
  yearsOfExperience?: number;
  personalStatement?: string;
  learningGoals?: string;
  background?: string;
}

export type RouteContext = {
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

      if (
        path.length === 4 &&
        path[1] === "enroll" &&
        path[2] === "application" &&
        path[3] === "status"
      ) {
        const authUserId = await resolveUserId(request);
        const result = await domain.enrollment.getApplicationStatus(
          path[0],
          authUserId,
        );
        return NextResponse.json(
          {
            success: true,
            requestId: request.headers.get("x-request-id") ?? randomUUID(),
            data: result,
          },
          { status: 200 },
        );
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
      logUnexpectedError("[api/courses] GET handler error:", error);
      return errorResponse(error);
    }
  };

  const POST = async (request: NextRequest, context: RouteContext) => {
    try {
      const { path = [] } = await context.params;
      const domain = deps.createDomain();
      const userId = await resolveUserId(request);
      const body = await safeJson<CourseEnrollmentRequest & ApplicationBody>(
        request,
      );
      const requestId = request.headers.get("x-request-id") ?? randomUUID();

      if (path.length === 2 && path[1] === "enroll") {
        const result = await domain.enrollment.enrollFree(
          path[0],
          userId,
          body,
          { requestId },
        );
        return NextResponse.json(result, { status: 200 });
      }

      if (path.length === 3 && path[1] === "enroll" && path[2] === "free") {
        const result = await domain.enrollment.enrollFree(
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

      if (path.length === 2 && path[1] === "inquiry") {
        const courseId = path[0];
        const inquiryBody = body;

        if (!inquiryBody?.name || !inquiryBody?.email) {
          throw new NextCourseError(
            "BAD_REQUEST",
            400,
            "Name and email are required",
            9005,
          );
        }

        const result = await domain.enrollment.submitInquiry(
          courseId,
          userId,
          {
            name: inquiryBody.name,
            email: inquiryBody.email,
            phone: inquiryBody.phone,
            message: inquiryBody.message,
            sourceSurface: inquiryBody.sourceSurface,
            idempotencyKey: inquiryBody.idempotencyKey,
          },
        );

        return NextResponse.json(
          {
            inquiryId: result.id,
            message:
              "Your inquiry has been submitted. Our team will contact you shortly.",
          },
          { status: 200 },
        );
      }

      if (
        path.length === 3 &&
        path[1] === "enroll" &&
        path[2] === "application"
      ) {
        const courseId = path[0];
        const applicationBody = body;

        if (
          !applicationBody?.name ||
          !applicationBody?.email ||
          !applicationBody?.age ||
          !applicationBody?.phone ||
          !applicationBody?.learnerStatus ||
          !applicationBody?.personalStatement ||
          !applicationBody?.learningGoals ||
          !applicationBody?.background
        ) {
          throw new NextCourseError(
            "BAD_REQUEST",
            400,
            "Application fields are incomplete",
            9005,
          );
        }

        const result = await domain.enrollment.submitApplication(
          courseId,
          userId,
          {
            name: applicationBody.name,
            age: applicationBody.age,
            email: applicationBody.email,
            phone: applicationBody.phone,
            learnerStatus: applicationBody.learnerStatus,
            highSchoolName: applicationBody.highSchoolName,
            university: applicationBody.university,
            faculty: applicationBody.faculty,
            graduationYear: applicationBody.graduationYear,
            workField: applicationBody.workField,
            yearsOfExperience: applicationBody.yearsOfExperience,
            personalStatement: applicationBody.personalStatement,
            learningGoals: applicationBody.learningGoals,
            background: applicationBody.background,
            sourceSurface: applicationBody.sourceSurface,
            idempotencyKey: applicationBody.idempotencyKey,
          },
        );

        return NextResponse.json(
          {
            applicationId: result.id,
            message:
              "Your application has been submitted. Our team will review it shortly.",
          },
          { status: 200 },
        );
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
      logUnexpectedError("[api/courses] POST handler error:", error);
      return errorResponse(error);
    }
  };

  return { GET, POST };
};
