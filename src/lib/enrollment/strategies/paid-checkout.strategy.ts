import { coursesService } from "@/lib/api/courses.service";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { mapEnrollmentError } from "@/lib/enrollment/error-mapper";

export const executePaidCheckoutInit = async (
  context: EnrollmentContext,
  apiClient: typeof coursesService = coursesService,
): Promise<EnrollmentExecutionResult> => {
  try {
    const response = await apiClient.initPaidEnrollment(context.course.id, {
      sourceSurface: context.command.source,
      idempotencyKey: context.command.correlationId,
      returnUrl:
        typeof window !== "undefined" ? window.location.href : undefined,
    });

    return {
      ok: true,
      mode: "paid",
      nextAction: "checkout",
      message: response.message,
      checkoutUrl: response.data.checkoutUrl,
    };
  } catch (error) {
    const mapped = mapEnrollmentError(error);
    return {
      ok: false,
      mode: "paid",
      code: mapped.code,
      message: mapped.message,
    };
  }
};
