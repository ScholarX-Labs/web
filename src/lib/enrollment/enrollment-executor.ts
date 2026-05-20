import {
  EnrollmentContext,
  EnrollmentExecutionResult,
  EnrollmentMode,
} from "@/lib/enrollment/types";
import { executeFreeEnroll } from "@/lib/enrollment/strategies/free-enroll.strategy";
import { executeFormApplicationInit } from "@/lib/enrollment/strategies/form-application.strategy";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";

export const deriveEnrollmentMode = (
  context: EnrollmentContext,
): EnrollmentMode => {
  if (context.course.requiresForm) return "application";
  if (context.course.salesInquiry && (context.course.price ?? 0) > 0)
    return "inquiry";
  if ((context.course.price ?? 0) > 0) return "paid";
  return "free";
};

export const executeEnrollment = async (
  context: EnrollmentContext,
): Promise<EnrollmentExecutionResult> => {
  const mode = deriveEnrollmentMode(context);

  emitEnrollmentEvent({
    event: "enroll_submission_started",
    timestamp: Date.now(),
    courseId: context.command.courseId,
    sourceSurface: context.command.source,
    correlationId: context.command.correlationId,
  });

  let result: EnrollmentExecutionResult;

  if (mode === "free") {
    result = await executeFreeEnroll(context);
  } else if (mode === "inquiry") {
    emitEnrollmentEvent({
      event: "enroll_inquiry_prompted",
      timestamp: Date.now(),
      courseId: context.command.courseId,
      sourceSurface: context.command.source,
      correlationId: context.command.correlationId,
    });
    result = {
      ok: true,
      mode: "inquiry",
      nextAction: "inquiry",
      message: "Please fill in your contact details",
    };
    return result;
  } else {
    result = await executeFormApplicationInit(context);
  }

  if (result.ok) {
    emitEnrollmentEvent({
      event: "enroll_submission_succeeded",
      timestamp: Date.now(),
      courseId: context.command.courseId,
      sourceSurface: context.command.source,
      correlationId: context.command.correlationId,
    });
  } else {
    emitEnrollmentEvent({
      event: "enroll_submission_failed",
      timestamp: Date.now(),
      courseId: context.command.courseId,
      sourceSurface: context.command.source,
      correlationId: context.command.correlationId,
      errorCode: result.code,
    });
  }

  return result;
};
