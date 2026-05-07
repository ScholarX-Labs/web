import { coursesService } from "@/lib/api/courses.service";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { mapEnrollmentError } from "@/lib/enrollment/error-mapper";

export const executeFreeEnroll = async (
  context: EnrollmentContext,
  apiClient: Pick<typeof coursesService, "enrollFree"> = coursesService,
): Promise<EnrollmentExecutionResult> => {
  try {
    console.log(
      "[FREE_ENROLL] calling enrollFree with courseId:",
      context.course.id,
    );
    const response = await apiClient.enrollFree(context.course.id, {
      sourceSurface: context.command.source,
      idempotencyKey: context.command.correlationId,
    });
    console.log("[FREE_ENROLL] enrollFree response:", response);

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
    console.error("[FREE_ENROLL] catch error:", error);
    const mapped = mapEnrollmentError(error);
    return {
      ok: false,
      mode: "free",
      code: mapped.code,
      message: mapped.message,
    };
  }
};
