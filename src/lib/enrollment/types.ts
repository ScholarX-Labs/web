import { Course } from "@/types/course.types";

export type EnrollmentLifecycle =
  | "idle"
  | "precheck"
  | "auth_redirect"
  | "modal_open"
  | "processing"
  | "success"
  | "error"
  | "closed";

export type EnrollmentSourceSurface =
  | "latest_course_card"
  | "course_card"
  | "course_hero"
  | "course_sticky_cta"
  | "course_detail_sheet"
  | "deep_link";

export type EnrollmentMode = "free" | "paid" | "application";

export type EnrollmentErrorCode =
  | "auth_required"
  | "already_enrolled"
  | "course_not_found"
  | "payment_unavailable"
  | "validation_failure"
  | "network_transient"
  | "NOT_FOUND"
  | "unknown";

export interface EnrollIntentCommand {
  courseId: string;
  source: EnrollmentSourceSurface;
  correlationId: string;
  timestamp: number;
  viewport: "desktop" | "mobile";
  reducedMotion: boolean;
}

export interface EnrollmentContext {
  command: EnrollIntentCommand;
  course: Pick<Course, "id" | "slug" | "title" | "requiresForm" | "price">;
}

export interface EnrollmentExecutionSuccess {
  ok: true;
  mode: EnrollmentMode;
  nextAction: "resume_learning" | "checkout" | "application" | "none";
  message?: string;
  checkoutUrl?: string;
  applicationUrl?: string;
}

export interface EnrollmentExecutionFailure {
  ok: false;
  mode: EnrollmentMode;
  code: EnrollmentErrorCode;
  message: string;
}

export type EnrollmentExecutionResult =
  | EnrollmentExecutionSuccess
  | EnrollmentExecutionFailure;
