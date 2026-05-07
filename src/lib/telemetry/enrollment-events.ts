import {
  EnrollmentErrorCode,
  EnrollmentSourceSurface,
} from "@/lib/enrollment/types";

export type EnrollmentTelemetryEventName =
  | "enroll_click"
  | "enroll_submission_started"
  | "enroll_submission_succeeded"
  | "enroll_submission_failed";

interface BaseEnrollmentTelemetryEvent {
  event: EnrollmentTelemetryEventName;
  timestamp: number;
  courseId: string;
  sourceSurface?: EnrollmentSourceSurface;
  correlationId?: string;
}

interface EnrollmentFailedEvent extends BaseEnrollmentTelemetryEvent {
  event: "enroll_submission_failed";
  errorCode?: EnrollmentErrorCode;
}

export type EnrollmentTelemetryEvent =
  | BaseEnrollmentTelemetryEvent
  | EnrollmentFailedEvent;

export const emitEnrollmentEvent = (event: EnrollmentTelemetryEvent) => {
  if (process.env.NODE_ENV !== "production") {
    // Keep transport pluggable; this console path is a safe default.
    // eslint-disable-next-line no-console
    console.debug("[telemetry]", event);
  }
};
