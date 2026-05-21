import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCourseProgress,
  dbCourses,
  dbLessonProgress,
  dbProgressSyncEvents,
} from "@/db/schema/courses-db.schema";
import { dbLessons } from "@/db/schema/admin-db.schema";
import type {
  CourseProgressMutation,
  ICourseProgressCommandRepository,
  ICourseProgressQueryRepository,
} from "@/domain/courses/contracts/course-progress.repository";
import type {
  CourseLessonRecord,
  CourseProgressCourseRecord,
  CourseProgressResult,
  CourseProgressSnapshot,
  LessonProgressSnapshot,
  ProgressSyncEventRecord,
  SyncLessonProgressCommand,
} from "@/domain/courses/contracts/course-progress.types";
import { dateToIsoOrNull } from "@/domain/courses/application/course-progress.mapper";
import { PUBLIC_LESSON_STATUSES } from "@/domain/courses/application/public-lesson-status";

type DbClient = typeof db;

const mapCourseProgress = (
  row: typeof dbCourseProgress.$inferSelect,
): CourseProgressSnapshot => ({
  id: row.id,
  userId: row.userId,
  courseId: row.courseId,
  status: row.status,
  completedLessons: row.completedLessons,
  requiredLessons: row.requiredLessons,
  progressPercentage: row.progressPercentage,
  completedAt: dateToIsoOrNull(row.completedAt),
  certificateEligibleAt: dateToIsoOrNull(row.certificateEligibleAt),
  lastLessonId: row.lastLessonId,
  lastPosition: row.lastPosition,
  version: row.version,
  curriculumVersion: row.curriculumVersion,
  ruleVersion: row.ruleVersion,
  completedByBackfill: row.completedByBackfill,
});

const mapLessonProgress = (
  row: typeof dbLessonProgress.$inferSelect,
): LessonProgressSnapshot => ({
  id: row.id,
  lessonId: row.lessonId,
  courseId: row.courseId,
  completed: row.completed,
  completedAt: dateToIsoOrNull(row.completedAt),
  watchedPercentage: row.watchedPercentage,
  lastPosition: row.lastPosition,
});

export class NextCourseProgressRepository
  implements ICourseProgressCommandRepository, ICourseProgressQueryRepository
{
  constructor(private readonly client: DbClient = db) {}

  async withProgressTransaction<T>(
    fn: (repository: ICourseProgressCommandRepository) => Promise<T>,
  ): Promise<T> {
    return this.client.transaction((tx) =>
      fn(new NextCourseProgressRepository(tx as unknown as DbClient)),
    );
  }

  async findCourse(
    courseId: string,
  ): Promise<CourseProgressCourseRecord | null> {
    const courseRows = await this.client
      .select({
        id: dbCourses.id,
        title: dbCourses.title,
        status: dbCourses.status,
        isArchived: dbCourses.isArchived,
      })
      .from(dbCourses)
      .where(eq(dbCourses.id, courseId))
      .limit(1);

    const course = courseRows[0];
    if (!course) return null;

    const lessonCountRows = await this.client
      .select({ value: count() })
      .from(dbLessons)
      .where(
        and(
          eq(dbLessons.courseId, courseId),
          inArray(dbLessons.status, PUBLIC_LESSON_STATUSES),
          eq(dbLessons.isArchived, false),
        ),
      );

    return {
      ...course,
      curriculumVersion: 1,
      requiredLessonsCount: lessonCountRows[0]?.value ?? 0,
      certificateEnabled: true,
    };
  }

  async findLessonInCourse(
    courseId: string,
    lessonId: string,
  ): Promise<CourseLessonRecord | null> {
    const rows = await this.client
      .select({
        id: dbLessons.id,
        courseId: dbLessons.courseId,
        status: dbLessons.status,
        isArchived: dbLessons.isArchived,
      })
      .from(dbLessons)
      .where(
        and(
          eq(dbLessons.id, lessonId),
          eq(dbLessons.courseId, courseId),
          inArray(dbLessons.status, PUBLIC_LESSON_STATUSES),
          eq(dbLessons.isArchived, false),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async findOrInitializeCourseProgress(userId: string, courseId: string) {
    await this.client
      .insert(dbCourseProgress)
      .values({ userId, courseId })
      .onConflictDoNothing({
        target: [dbCourseProgress.userId, dbCourseProgress.courseId],
      });

    const rows = await this.client
      .select()
      .from(dbCourseProgress)
      .where(
        and(
          eq(dbCourseProgress.userId, userId),
          eq(dbCourseProgress.courseId, courseId),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to initialize course progress");
    }

    return mapCourseProgress(row);
  }

  async findProgressEvent(
    userId: string,
    clientEventId: string,
  ): Promise<ProgressSyncEventRecord | null> {
    const rows = await this.client
      .select()
      .from(dbProgressSyncEvents)
      .where(
        and(
          eq(dbProgressSyncEvents.userId, userId),
          eq(dbProgressSyncEvents.clientEventId, clientEventId),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      clientEventId: row.clientEventId,
      userId: row.userId,
      requestHash: row.requestHash,
      responseSnapshot: row.responseSnapshot as CourseProgressResult | null,
    };
  }

  async createProgressEvent(params: {
    userId: string;
    courseId: string;
    lessonId: string;
    clientEventId: string;
    eventType: SyncLessonProgressCommand["eventType"];
    requestHash: string;
    responseSnapshot: CourseProgressResult;
  }): Promise<void> {
    await this.client.insert(dbProgressSyncEvents).values({
      userId: params.userId,
      courseId: params.courseId,
      lessonId: params.lessonId,
      clientEventId: params.clientEventId,
      eventType: params.eventType,
      requestHash: params.requestHash,
      responseSnapshot: params.responseSnapshot,
    });
  }

  async upsertLessonProgress(command: SyncLessonProgressCommand) {
    const completedAt = command.completed
      ? (command.completedAt ?? new Date())
      : null;

    const rows = await this.client
      .insert(dbLessonProgress)
      .values({
        userId: command.userId,
        lessonId: command.lessonId,
        courseId: command.courseId,
        completed: command.completed ?? false,
        completedAt,
        watchedPercentage: command.watchedPercentage ?? 0,
        lastPosition: command.lastPosition ?? 0,
        lastClientEventId: command.clientEventId,
      })
      .onConflictDoUpdate({
        target: [dbLessonProgress.userId, dbLessonProgress.lessonId],
        set: {
          completed: sql`${dbLessonProgress.completed} OR ${command.completed ?? false}`,
          completedAt: sql`COALESCE(${dbLessonProgress.completedAt}, ${completedAt})`,
          watchedPercentage: sql`GREATEST(${dbLessonProgress.watchedPercentage}, ${command.watchedPercentage ?? 0})`,
          lastPosition: command.lastPosition ?? 0,
          lastClientEventId: command.clientEventId,
          updatedAt: new Date(),
        },
      })
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to upsert lesson progress");
    return mapLessonProgress(row);
  }

  async countCompletedLessons(userId: string, courseId: string) {
    const rows = await this.client
      .select({ value: count() })
      .from(dbLessonProgress)
      .innerJoin(dbLessons, eq(dbLessons.id, dbLessonProgress.lessonId))
      .where(
        and(
          eq(dbLessonProgress.userId, userId),
          eq(dbLessonProgress.courseId, courseId),
          eq(dbLessonProgress.completed, true),
          inArray(dbLessons.status, PUBLIC_LESSON_STATUSES),
          eq(dbLessons.isArchived, false),
        ),
      );

    return rows[0]?.value ?? 0;
  }

  async updateCourseProgressWithVersion(mutation: CourseProgressMutation) {
    const rows = await this.client
      .update(dbCourseProgress)
      .set({
        status: mutation.status,
        completedLessons: mutation.completedLessons,
        requiredLessons: mutation.requiredLessons,
        progressPercentage: mutation.progressPercentage,
        completedAt: mutation.completedAt,
        certificateEligibleAt: mutation.certificateEligibleAt,
        lastLessonId: mutation.lastLessonId,
        lastPosition: mutation.lastPosition,
        curriculumVersion: mutation.curriculumVersion,
        ruleVersion: mutation.ruleVersion,
        version: sql`${dbCourseProgress.version} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(dbCourseProgress.userId, mutation.userId),
          eq(dbCourseProgress.courseId, mutation.courseId),
          eq(dbCourseProgress.version, mutation.expectedVersion),
        ),
      )
      .returning();

    return rows[0] ? mapCourseProgress(rows[0]) : null;
  }

  async getCourseProgress(userId: string, courseId: string) {
    const rows = await this.client
      .select()
      .from(dbCourseProgress)
      .where(
        and(
          eq(dbCourseProgress.userId, userId),
          eq(dbCourseProgress.courseId, courseId),
        ),
      )
      .limit(1);

    return rows[0] ? mapCourseProgress(rows[0]) : null;
  }

  async getLessonProgress(userId: string, courseId: string) {
    const rows = await this.client
      .select()
      .from(dbLessonProgress)
      .where(
        and(
          eq(dbLessonProgress.userId, userId),
          eq(dbLessonProgress.courseId, courseId),
        ),
      )
      .orderBy(desc(dbLessonProgress.updatedAt));

    return rows.map(mapLessonProgress);
  }
}
