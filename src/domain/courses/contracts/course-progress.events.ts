import type {
  CertificateCompletionSource,
  ProgressSyncEventType,
} from "@/domain/courses/contracts/course-progress.types";

export interface CourseCompletedEvent {
  type: "CourseCompleted";
  userId: string;
  courseId: string;
  courseProgressId: string;
  completedAt: string;
  completedByBackfill: boolean;
  ruleVersion: string;
}

export interface CertificateIssuedEvent {
  type: "CertificateIssued";
  userId: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: string;
  completionSource: CertificateCompletionSource;
}

export interface ProgressSyncFailedEvent {
  type: "ProgressSyncFailed";
  userId: string;
  courseId: string;
  lessonId: string;
  clientEventId: string;
  eventType: ProgressSyncEventType;
  errorCode: string;
}

export type CourseProgressDomainEvent =
  | CourseCompletedEvent
  | CertificateIssuedEvent
  | ProgressSyncFailedEvent;
