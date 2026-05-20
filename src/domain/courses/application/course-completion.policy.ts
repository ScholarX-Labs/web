import type {
  CourseCompletionDecision,
  CourseProgressSnapshot,
  CourseProgressStatus,
  ProgressSyncEventType,
} from "@/domain/courses/contracts/course-progress.types";

export const COURSE_COMPLETION_RULE_VERSION = "v1";
export const VIDEO_LESSON_COMPLETE_AT_PERCENT = 90;

export interface LessonCompletionInput {
  eventType: ProgressSyncEventType;
  completed?: boolean;
  completedAt?: Date | null;
  watchedPercentage: number;
}

export class LessonCompletionPolicy {
  isLessonComplete(input: LessonCompletionInput): boolean {
    if (input.eventType === "manual_complete") return input.completed === true;
    if (input.eventType === "completion") return true;
    return input.watchedPercentage >= VIDEO_LESSON_COMPLETE_AT_PERCENT;
  }
}

export interface CourseCompletionInput {
  current: CourseProgressSnapshot;
  completedLessonCount: number;
  requiredLessonCount: number;
  now: Date;
}

export class CourseCompletionPolicy {
  evaluate(input: CourseCompletionInput): CourseCompletionDecision {
    const requiredLessons = Math.max(0, input.requiredLessonCount);
    const completedLessons = Math.max(0, input.completedLessonCount);
    const progressPercentage =
      requiredLessons === 0
        ? 0
        : Math.min(
            100,
            Math.floor((completedLessons / requiredLessons) * 100),
          );

    const isCompleted =
      requiredLessons > 0 && completedLessons >= requiredLessons;
    const status: CourseProgressStatus = isCompleted
      ? "completed"
      : completedLessons > 0
        ? "in_progress"
        : "not_started";

    const completedAt =
      status === "completed"
        ? input.current.completedAt
          ? new Date(input.current.completedAt)
          : input.now
        : null;

    const certificateEligibleAt =
      status === "completed"
        ? input.current.certificateEligibleAt
          ? new Date(input.current.certificateEligibleAt)
          : completedAt
        : null;

    return {
      status,
      progressPercentage,
      completedAt,
      certificateEligibleAt,
    };
  }
}
