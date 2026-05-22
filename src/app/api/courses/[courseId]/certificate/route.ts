import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import { createCourseProgressDomain } from "@/domain/courses";
import { createNextCourseDomain } from "@/domain/courses";
import { isCertificateError } from "@/domain/certificates/domain/certificate-errors";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

function errorResponse(error: unknown): NextResponse {
  if (isCertificateError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          statusCode: error.statusCode,
          message: error.message,
          details: error.details ?? null,
        },
      },
      { status: error.statusCode },
    );
  }

  console.error("[POST /api/courses/[courseId]/certificate] Unhandled error:", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        statusCode: 500,
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
}

/**
 * POST /api/courses/:courseId/certificate
 *
 * Issues a canonical certificate for a completed course.
 * Idempotent: returns the existing certificate if already issued.
 *
 * Auth: required.
 * Response: { certificateNumber, certificateUrl, artifactStatus, alreadyIssued }
 */
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
            statusCode: 401,
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const { courseId } = await context.params;

    // Verify course completion from the courses domain (eligibility source of truth)
    const progressDomain = createCourseProgressDomain();
    const progress = await progressDomain.progressQuery.getCourseProgress(
      userId,
      courseId,
    );

    if (
      !progress ||
      progress.status !== "completed" ||
      !progress.completedAt ||
      !progress.certificateEligibleAt
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CERTIFICATE_NOT_ELIGIBLE",
            statusCode: 409,
            message: "This course is not eligible for certificate issuance yet.",
          },
        },
        { status: 409 },
      );
    }

    // Fetch course title for the certificate snapshot
    const courseDomain = createNextCourseDomain();
    const course = await courseDomain.catalog.getById(courseId, userId);

    // Issue via the canonical certificate domain
    const certDomain = createCertificateDomain();
    const result = await certDomain.issueService.issueForCourseCompletion({
      userId,
      courseId,
      courseProgressId: progress.id,
      completedAt: new Date(progress.completedAt),
      recipientName:
        session.user.name ?? session.user.email ?? "ScholarX Learner",
      recipientEmail: session.user.email ?? undefined,
      courseTitle: course.title,
      completionSource: progress.completedByBackfill
        ? "backfill_approximate"
        : "live",
      ruleVersion: progress.ruleVersion ?? "course_completion_v1",
    });

    return NextResponse.json(
      {
        success: true,
        certificateNumber: result.certificate.certificateNumber,
        certificateUrl: ROUTES.CERTIFICATE_DETAIL(
          result.certificate.certificateNumber,
        ),
        artifactStatus: result.artifactStatus,
        alreadyIssued: result.alreadyIssued,
      },
      { status: result.alreadyIssued ? 200 : 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
