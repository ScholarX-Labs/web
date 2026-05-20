import type {
  ICourseProgressCommandRepository,
  ICourseProgressQueryRepository,
} from "@/domain/courses/contracts/course-progress.repository";
import type { IEnrollmentReadRepository } from "@/domain/courses/contracts/enrollment.repository";
import type {
  CourseProgressResult,
  SyncLessonProgressCommand,
} from "@/domain/courses/contracts/course-progress.types";
import { NextCourseError } from "@/domain/courses/application/next-course.errors";
import {
  COURSE_COMPLETION_RULE_VERSION,
  CourseCompletionPolicy,
  LessonCompletionPolicy,
} from "@/domain/courses/application/course-completion.policy";
import {
  ActiveEnrollmentSpecification,
  CourseWritableSpecification,
  LessonBelongsToCourseSpecification,
} from "@/domain/courses/application/course-completion.specifications";
import {
  clampPercentage,
  clampPosition,
} from "@/domain/courses/application/course-progress.mapper";

const MAX_CONCURRENCY_ATTEMPTS = 3;
const BACKOFF_MS = [25, 75, 150] as const;

const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class CourseProgressCommandService {
  constructor(
    private readonly commandRepository: ICourseProgressCommandRepository,
    private readonly queryRepository: ICourseProgressQueryRepository,
    private readonly enrollmentRepository: IEnrollmentReadRepository,
    private readonly lessonCompletionPolicy = new LessonCompletionPolicy(),
    private readonly courseCompletionPolicy = new CourseCompletionPolicy(),
  ) {}

  async syncLessonProgress(
    command: SyncLessonProgressCommand,
  ): Promise<CourseProgressResult> {
    const normalized = {
      ...command,
      watchedPercentage: clampPercentage(command.watchedPercentage),
      lastPosition: clampPosition(command.lastPosition),
    };

    const [course, lesson, subscription] = await Promise.all([
      this.commandRepository.findCourse(normalized.courseId),
      this.commandRepository.findLessonInCourse(
        normalized.courseId,
        normalized.lessonId,
      ),
      this.enrollmentRepository.findActiveSubscription(
        normalized.userId,
        normalized.courseId,
      ),
    ]);

    const courseWritable: CourseWritableSpecification =
      new CourseWritableSpecification();
    const lessonBelongsToCourse: LessonBelongsToCourseSpecification =
      new LessonBelongsToCourseSpecification();
    const activeEnrollment: ActiveEnrollmentSpecification =
      new ActiveEnrollmentSpecification();

    courseWritable.assertSatisfiedBy(course);
    lessonBelongsToCourse.assertSatisfiedBy(lesson);
    activeEnrollment.assertSatisfiedBy(subscription, {
      userId: normalized.userId,
      courseId: normalized.courseId,
    });

    for (let attempt = 0; attempt < MAX_CONCURRENCY_ATTEMPTS; attempt += 1) {
      const result = await this.commandRepository.withProgressTransaction(
        async (repository) => {
          const existingEvent = await repository.findProgressEvent(
            normalized.userId,
            normalized.clientEventId,
          );

          if (existingEvent) {
            if (existingEvent.requestHash !== normalized.requestHash) {
              throw new NextCourseError(
                "IDEMPOTENCY_CONFLICT",
                409,
                "The same progress event id was used with different request data.",
                9104,
                { clientEventId: normalized.clientEventId },
              );
            }

            if (!existingEvent.responseSnapshot) {
              throw new NextCourseError(
                "IDEMPOTENCY_REPLAY_PENDING",
                409,
                "The progress event is still being processed.",
                9105,
                { clientEventId: normalized.clientEventId },
              );
            }

            return existingEvent.responseSnapshot;
          }

          const current = await repository.findOrInitializeCourseProgress(
            normalized.userId,
            normalized.courseId,
          );

          const completed = this.lessonCompletionPolicy.isLessonComplete({
            eventType: normalized.eventType,
            completed: normalized.completed,
            completedAt: normalized.completedAt,
            watchedPercentage: normalized.watchedPercentage,
          });

          const lessonProgress = await repository.upsertLessonProgress({
            ...normalized,
            completed,
            completedAt: completed
              ? normalized.completedAt ?? new Date()
              : normalized.completedAt ?? null,
          });

          const completedLessons = await repository.countCompletedLessons(
            normalized.userId,
            normalized.courseId,
          );

          const decision = this.courseCompletionPolicy.evaluate({
            current,
            completedLessonCount: completedLessons,
            requiredLessonCount: course.requiredLessonsCount,
            now: new Date(),
          });

          const nextProgress = await repository.updateCourseProgressWithVersion({
            expectedVersion: current.version,
            userId: normalized.userId,
            courseId: normalized.courseId,
            status: decision.status,
            completedLessons,
            requiredLessons: course.requiredLessonsCount,
            progressPercentage: decision.progressPercentage,
            completedAt: decision.completedAt,
            certificateEligibleAt: decision.certificateEligibleAt,
            lastLessonId: normalized.lessonId,
            lastPosition: normalized.lastPosition,
            curriculumVersion: course.curriculumVersion,
            ruleVersion: COURSE_COMPLETION_RULE_VERSION,
          });

          if (!nextProgress) return null;

          const response = {
            lesson: lessonProgress,
            course: nextProgress,
          };

          await repository.createProgressEvent({
            userId: normalized.userId,
            courseId: normalized.courseId,
            lessonId: normalized.lessonId,
            clientEventId: normalized.clientEventId,
            eventType: normalized.eventType,
            requestHash: normalized.requestHash,
            responseSnapshot: response,
          });

          return response;
        },
      );

      if (result) return result;

      await wait(BACKOFF_MS[attempt] ?? 150);
    }

    throw new NextCourseError(
      "CONCURRENT_PROGRESS_UPDATE",
      409,
      "Progress changed while this request was being saved. Please retry.",
      9106,
      { courseId: normalized.courseId, lessonId: normalized.lessonId },
    );
  }

  async getLatestProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgressResult | null> {
    const [course, lessons] = await Promise.all([
      this.queryRepository.getCourseProgress(userId, courseId),
      this.queryRepository.getLessonProgress(userId, courseId),
    ]);
    const latestLesson = lessons[0];

    if (!course || !latestLesson) return null;

    return {
      lesson: latestLesson,
      course,
    };
  }
}
