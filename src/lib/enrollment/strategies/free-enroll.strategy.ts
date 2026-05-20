import { coursesService } from "@/lib/api/courses.service";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { mapEnrollmentError } from "@/lib/enrollment/error-mapper";

export const executeFreeEnroll = async (
  context: EnrollmentContext,
  apiClient: typeof coursesService = coursesService,
): Promise<EnrollmentExecutionResult> => {
  try {
    const response = await apiClient.enrollFree(context.course.id, {
      sourceSurface: context.command.source,
      idempotencyKey: context.command.correlationId,
    });

    return {
      ok: true,
      mode: "free",
      nextAction:
        response.data.nextAction === "resume_learning"
          ? "resume_learning"
          : "none",
      message: response.message,
    };
  } catch (error) {
    const mapped = mapEnrollmentError(error);
    return {
      ok: false,
      mode: "free",
      code: mapped.code,
      message: mapped.message,
    };
  }
};
