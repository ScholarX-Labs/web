import { NextRequest, NextResponse } from "next/server";
import {
  createCourseProgressDomain,
  createNextCourseDomain,
  isNextCourseError,
} from "@/domain/courses";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            numericCode: 9002,
            statusCode: 401,
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const { courseId } = await context.params;
    const progressDomain = createCourseProgressDomain();
    const courseDomain = createNextCourseDomain();
    const [progress, course] = await Promise.all([
      progressDomain.progressQuery.getCourseProgress(userId, courseId),
      courseDomain.catalog.getById(courseId, userId),
    ]);

    if (!progress) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CERTIFICATE_NOT_ELIGIBLE",
            numericCode: 9201,
            statusCode: 409,
            message: "This course is not eligible for certificate issuance yet.",
          },
        },
        { status: 409 },
      );
    }

    const result = await progressDomain.certificate.issueCertificate({
      userId,
      courseId,
      learnerDisplayName:
        session.user.name ?? session.user.email ?? "ScholarX Learner",
      courseTitle: course.title,
      progress,
    });

    return NextResponse.json(
      {
        ...result,
        certificateUrl: ROUTES.CERTIFICATE_DETAIL(
          result.certificate.certificateNumber,
        ),
      },
      { status: result.alreadyIssued ? 200 : 201 },
    );
  } catch (error) {
    console.error("[course-certificate] POST failed:", error);
    return errorResponse(error);
  }
}
