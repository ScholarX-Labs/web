import { NextRequest } from "next/server";
import {
  createErrorResponse,
  createSuccessResponse,
  getApplicationRequestId,
  getAuthenticatedUserId,
  getCourseDomain,
  withCourseApplicationErrorHandling,
} from "@/app/api/v1/courses/_application-route-helpers";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ courseId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
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
    const domain = getCourseDomain();
    const result = await domain.enrollment.getApplicationStatus(courseId, userId);

    return createSuccessResponse(requestId, result, { status: 200 });
  } catch (error) {
    return withCourseApplicationErrorHandling(request, error);
  }
}
