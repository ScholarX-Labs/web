import type {
  CourseLessonRecord,
  CourseProgressCourseRecord,
  CourseProgressResult,
  CourseProgressSnapshot,
  LessonProgressSnapshot,
  ProgressSyncEventRecord,
  SyncLessonProgressCommand,
} from "@/domain/courses/contracts/course-progress.types";

export interface CourseProgressMutation {
  expectedVersion: number;
  userId: string;
  courseId: string;
  status: CourseProgressSnapshot["status"];
  completedLessons: number;
  requiredLessons: number;
  progressPercentage: number;
  completedAt: Date | null;
  certificateEligibleAt: Date | null;
  lastLessonId: string | null;
  lastPosition: number;
  curriculumVersion: number;
  ruleVersion: string;
}

export interface ICourseProgressCommandRepository {
  withProgressTransaction<T>(
    fn: (repository: ICourseProgressCommandRepository) => Promise<T>,
  ): Promise<T>;
  findCourse(courseId: string): Promise<CourseProgressCourseRecord | null>;
  findLessonInCourse(
    courseId: string,
    lessonId: string,
  ): Promise<CourseLessonRecord | null>;
  findOrInitializeCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgressSnapshot>;
  findProgressEvent(
    userId: string,
    clientEventId: string,
  ): Promise<ProgressSyncEventRecord | null>;
  createProgressEvent(params: {
    userId: string;
    courseId: string;
    lessonId: string;
    clientEventId: string;
    eventType: SyncLessonProgressCommand["eventType"];
    requestHash: string;
    responseSnapshot: CourseProgressResult;
  }): Promise<void>;
  upsertLessonProgress(
    command: SyncLessonProgressCommand,
  ): Promise<LessonProgressSnapshot>;
  countCompletedLessons(userId: string, courseId: string): Promise<number>;
  updateCourseProgressWithVersion(
    mutation: CourseProgressMutation,
  ): Promise<CourseProgressSnapshot | null>;
}

export interface ICourseProgressQueryRepository {
  getCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgressSnapshot | null>;
  getLessonProgress(
    userId: string,
    courseId: string,
  ): Promise<LessonProgressSnapshot[]>;
}
