import { coursesService } from "@/lib/api/courses.service";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { mapEnrollmentError } from "@/lib/enrollment/error-mapper";

export const executeFormApplicationInit = async (
  context: EnrollmentContext,
  apiClient: typeof coursesService = coursesService,
): Promise<EnrollmentExecutionResult> => {
  try {
    console.log(
      "[APP_ENROLL] calling initApplicationEnrollment with courseId:",
      context.course.id,
    );
    const response = await apiClient.initApplicationEnrollment(
      context.course.id,
      {
        sourceSurface: context.command.source,
        idempotencyKey: context.command.correlationId,
      },
    );
    console.log("[APP_ENROLL] initApplicationEnrollment response:", response);

    return {
      ok: true,
      mode: "application",
      nextAction: "application",
      message: response.message,
      applicationUrl: response.data.applicationUrl,
    };
  } catch (error) {
    console.error("[APP_ENROLL] catch error:", error);
    const mapped = mapEnrollmentError(error);
    return {
      ok: false,
      mode: "application",
      code: mapped.code,
      message: mapped.message,
    };
  }
};
