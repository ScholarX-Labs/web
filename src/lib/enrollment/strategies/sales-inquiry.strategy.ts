import { coursesService } from "@/lib/api/courses.service";
import {
  EnrollmentContext,
  EnrollmentExecutionResult,
} from "@/lib/enrollment/types";
import { mapEnrollmentError } from "@/lib/enrollment/error-mapper";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";

export interface InquiryFormData {
  name: string;
  email: string;
  phone?: string;
  message?: string;
}

export const executeSalesInquiry = async (
  context: EnrollmentContext,
  formData: InquiryFormData,
  apiClient: typeof coursesService = coursesService,
): Promise<EnrollmentExecutionResult> => {
  try {
    const response = await apiClient.submitInquiry(context.course.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      message: formData.message,
      sourceSurface: context.command.source,
      idempotencyKey: context.command.correlationId,
    });

    emitEnrollmentEvent({
      event: "enroll_submission_succeeded",
      timestamp: Date.now(),
      courseId: context.course.id,
      sourceSurface: context.command.source,
      correlationId: context.command.correlationId,
    });

    return {
      ok: true,
      mode: "inquiry",
      nextAction: "none",
      message: response.message || "Your inquiry has been submitted. Our team will contact you shortly.",
    };
  } catch (error) {
    const mapped = mapEnrollmentError(error);
    return {
      ok: false,
      mode: "inquiry",
      code: mapped.code,
      message: mapped.message,
    };
  }
};
