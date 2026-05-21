import {
  EnrollmentContext,
  EnrollmentExecutionResult,
  EnrollmentMode,
} from "@/lib/enrollment/types";
import { executeFreeEnroll } from "@/lib/enrollment/strategies/free-enroll.strategy";
import { executeFormApplicationInit } from "@/lib/enrollment/strategies/form-application.strategy";
import { executePaidCheckoutInit } from "@/lib/enrollment/strategies/paid-checkout.strategy";
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

  switch (mode) {
    case "free":
      result = await executeFreeEnroll(context);
      break;
    case "inquiry":
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
    case "paid":
      result = await executePaidCheckoutInit(context);
      break;
    case "application":
      result = await executeFormApplicationInit(context);
      break;
    default: {
      const exhaustiveMode: never = mode;
      throw new Error(`Unhandled enrollment mode: ${exhaustiveMode}`);
    }
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
