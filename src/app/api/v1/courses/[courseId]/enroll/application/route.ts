import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  enforceApplicationSubmitRateLimit,
  getApplicationRequestId,
  getAuthenticatedUserId,
  getCourseDomain,
  withCourseApplicationErrorHandling,
} from "@/app/api/v1/courses/_application-route-helpers";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = getApplicationRequestId(request);

  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return createErrorResponse(
        requestId,
        401,
        "UNAUTHORIZED",
        "Authentication required",
      );
    }

    const { courseId } = await context.params;
    const rateLimited = await enforceApplicationSubmitRateLimit(
      request,
      userId,
      courseId,
      requestId,
    );

    if (rateLimited) {
      return rateLimited;
    }

    const body = ((await request.json().catch(() => ({}))) ?? {}) as Record<
      string,
      unknown
    >;
    const domain = getCourseDomain();
    const result = await domain.enrollment.submitApplication(courseId, userId, {
      ...body,
      idempotencyKey:
        request.headers.get("idempotency-key") ??
        (typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined),
    } as never);

    return createSuccessResponse(
      requestId,
      {
        applicationId: result.id,
        status: result.status,
        enrolledImmediately: Boolean(result.enrolledImmediately),
        message: result.enrolledImmediately
          ? "Application approved. You are enrolled immediately."
          : result.status === "approved"
            ? "Application approved."
            : "Your application has been submitted. Our team will review it shortly.",
      },
      { status: 200 },
    );
  } catch (error) {
    return withCourseApplicationErrorHandling(request, error);
  }
}
