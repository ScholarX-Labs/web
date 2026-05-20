export type CourseProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "stale_after_curriculum_change"
  | "revoked";

export type ProgressSyncEventType =
  | "heartbeat"
  | "pause"
  | "seek"
  | "completion"
  | "manual_complete";

export type CertificateCompletionSource =
  | "normal"
  | "backfill_approximate"
  | "admin_override";

export interface SyncLessonProgressCommand {
  userId: string;
  courseId: string;
  lessonId: string;
  clientEventId: string;
  requestHash: string;
  eventType: ProgressSyncEventType;
  completed?: boolean;
  completedAt?: Date | null;
  watchedPercentage?: number;
  lastPosition?: number;
}

export interface LessonProgressSnapshot {
  id: string;
  lessonId: string;
  courseId: string;
  completed: boolean;
  completedAt: string | null;
  watchedPercentage: number;
  lastPosition: number;
}

export interface CourseProgressSnapshot {
  id: string;
  userId: string;
  courseId: string;
  status: CourseProgressStatus;
  completedLessons: number;
  requiredLessons: number;
  progressPercentage: number;
  completedAt: string | null;
  certificateEligibleAt: string | null;
  lastLessonId: string | null;
  lastPosition: number;
  version: number;
  curriculumVersion: number;
  ruleVersion: string;
  completedByBackfill: boolean;
}

export interface CourseProgressResult {
  lesson: LessonProgressSnapshot;
  course: CourseProgressSnapshot;
}

export interface CourseProgressSummary extends CourseProgressSnapshot {
  courseTitle?: string;
  courseSlug?: string | null;
}

export interface CertificateMetadata {
  learnerDisplayName: string;
  courseTitle: string;
  completionDate: string;
  completionSource: CertificateCompletionSource;
  ruleVersion: string;
  requiredLessonCount: number;
  certificateTemplateVersion: string;
}

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  userId: string;
  courseId: string;
  courseProgressId: string;
  issuedAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
  metadata: CertificateMetadata;
}

export interface CertificateIssueResult {
  certificate: CertificateRecord;
  alreadyIssued: boolean;
}

export interface CourseCompletionDecision {
  status: CourseProgressStatus;
  progressPercentage: number;
  completedAt: Date | null;
  certificateEligibleAt: Date | null;
}

export interface CourseProgressCourseRecord {
  id: string;
  title: string;
  status: string;
  isArchived: boolean | null;
  curriculumVersion: number;
  requiredLessonsCount: number;
  certificateEnabled: boolean;
}

export interface CourseLessonRecord {
  id: string;
  courseId: string;
  status: string;
  isArchived: boolean | null;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  courseId: string;
}

export interface ProgressSyncEventRecord {
  id: string;
  clientEventId: string;
  userId: string;
  requestHash: string;
  responseSnapshot: CourseProgressResult | null;
}
