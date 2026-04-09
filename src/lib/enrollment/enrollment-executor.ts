import {
  EnrollmentContext,
  EnrollmentExecutionResult,
  EnrollmentMode,
} from "@/lib/enrollment/types";
import { executeFreeEnroll } from "@/lib/enrollment/strategies/free-enroll.strategy";
import { executePaidCheckoutInit } from "@/lib/enrollment/strategies/paid-checkout.strategy";
import { executeFormApplicationInit } from "@/lib/enrollment/strategies/form-application.strategy";
import { emitEnrollmentEvent } from "@/lib/telemetry/enrollment-events";

export const deriveEnrollmentMode = (
  context: EnrollmentContext,
): EnrollmentMode => {
  if (context.course.requiresForm) return "application";
  if ((context.course.price ?? 0) > 0) return "paid";
  return "free";
};

export const executeEnrollment = async (
  context: EnrollmentContext,
): Promise<EnrollmentExecutionResult> => {
  const mode = deriveEnrollmentMode(context);
  console.log("[EXECUTOR] executeEnrollment called with mode:", mode);

  emitEnrollmentEvent({
    event: "enroll_submission_started",
    timestamp: Date.now(),
    courseId: context.command.courseId,
    sourceSurface: context.command.source,
    correlationId: context.command.correlationId,
  });

  let result: EnrollmentExecutionResult;

  if (mode === "free") {
    console.log("[EXECUTOR] executing free enroll strategy");
    result = await executeFreeEnroll(context);
  } else if (mode === "paid") {
    console.log("[EXECUTOR] executing paid checkout strategy");
    result = await executePaidCheckoutInit(context);
  } else {
    console.log("[EXECUTOR] executing form application strategy");
    result = await executeFormApplicationInit(context);
  }

  console.log("[EXECUTOR] strategy returned result:", result);

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
