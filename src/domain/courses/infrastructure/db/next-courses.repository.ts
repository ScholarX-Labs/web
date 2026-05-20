import { and, asc, count, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCourseCategories,
  dbCourses,
  dbInquiries,
  dbLessonProgress,
  dbSubscriptions,
  dbUsers,
} from "@/db/schema/courses-db.schema";
import { dbLessons } from "@/db/schema/admin-db.schema";

export interface CourseListFilter {
  page: number;
  limit: number;
  category?: string;
  searchTitle?: string;
}

export interface FlatCourseRecord {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  imageUrl: string | null;
  videoPreviewUrl: string | null;
  category: string;
  level: string | null;
  currentPrice: number;
  originalPrice: number | null;
  status: string;
  rating: string | number | null;
  totalRatings: number | null;
  duration: string | null;
  lessonsCount: number | null;
  videosCount: number | null;
  studentsCount: number | null;
  isBestseller: boolean | null;
  urgencyText: string | null;
  tags: string[] | null;
  requiresForm: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  instructor: {
    id: string;
    name: string;
    avatar: string | null;
    title: string | null;
  } | null;
}

const courseColumns = {
  id: dbCourses.id,
  slug: dbCourses.slug,
  title: dbCourses.title,
  description: dbCourses.description,
  imageUrl: dbCourses.imageUrl,
  videoPreviewUrl: dbCourses.videoPreviewUrl,
  category: dbCourses.category,
  level: dbCourses.level,
  currentPrice: dbCourses.currentPrice,
  originalPrice: dbCourses.originalPrice,
  status: dbCourses.status,
  rating: dbCourses.rating,
  totalRatings: dbCourses.totalRatings,
  duration: dbCourses.duration,
  lessonsCount: dbCourses.lessonsCount,
  videosCount: dbCourses.videosCount,
  studentsCount: dbCourses.studentsCount,
  isBestseller: dbCourses.isBestseller,
  urgencyText: dbCourses.urgencyText,
  tags: dbCourses.tags,
  requiresForm: dbCourses.requiresForm,
  createdAt: dbCourses.createdAt,
  updatedAt: dbCourses.updatedAt,
};

const instructorColumns = {
  id: dbUsers.id,
  name: dbUsers.name,
  image: dbUsers.image,
};

const toWhereClause = (filter: CourseListFilter) => {
  const predicates = [eq(dbCourses.status, "active")];

  if (filter.category) {
    predicates.push(eq(dbCourses.category, filter.category));
  }

  if (filter.searchTitle) {
    predicates.push(ilike(dbCourses.title, `%${filter.searchTitle}%`));
  }

  return predicates.length === 1 ? predicates[0] : and(...predicates);
};

const mapCourseRecord = (row: {
  course: Record<string, unknown>;
  instructor: Record<string, unknown> | null;
}): FlatCourseRecord => ({
  id: row.course.id as string,
  slug: row.course.slug as string | null,
  title: row.course.title as string,
  description: row.course.description as string,
  imageUrl: row.course.imageUrl as string | null,
  videoPreviewUrl: row.course.videoPreviewUrl as string | null,
  category: row.course.category as string,
  level: row.course.level as string | null,
  currentPrice: row.course.currentPrice as number,
  originalPrice: row.course.originalPrice as number | null,
  status: row.course.status as string,
  rating: row.course.rating as string | number | null,
  totalRatings: row.course.totalRatings as number | null,
  duration: row.course.duration as string | null,
  lessonsCount: row.course.lessonsCount as number | null,
  videosCount: row.course.videosCount as number | null,
  studentsCount: row.course.studentsCount as number | null,
  isBestseller: row.course.isBestseller as boolean | null,
  urgencyText: row.course.urgencyText as string | null,
  tags: row.course.tags as string[] | null,
  requiresForm: row.course.requiresForm as boolean | null,
  createdAt: row.course.createdAt
    ? (row.course.createdAt as Date).toISOString()
    : null,
  updatedAt: row.course.updatedAt
    ? (row.course.updatedAt as Date).toISOString()
    : null,
  instructor: row.instructor
    ? {
        id: row.instructor.id as string,
        name: row.instructor.name as string,
        avatar: row.instructor.image as string | null,
        title: null,
      }
    : null,
});

export class NextCoursesRepository {
  async listActive(filter: CourseListFilter) {
    const offset = (filter.page - 1) * filter.limit;
    const whereClause = toWhereClause(filter);

    const [totalRes] = await db
      .select({ count: count() })
      .from(dbCourses)
      .where(whereClause);

    const rows = await db
      .select({ course: courseColumns, instructor: instructorColumns })
      .from(dbCourses)
      .leftJoin(dbUsers, eq(sql`${dbCourses.instructorId}::text`, dbUsers.id))
      .where(whereClause)
      .orderBy(asc(dbCourses.title))
      .limit(filter.limit)
      .offset(offset);

    return {
      totalCourses: totalRes?.count ?? 0,
      items: rows.map(mapCourseRecord),
    };
  }

  async listActiveCategories() {
    const rows = await db
      .select({
        name: dbCourseCategories.name,
        slug: dbCourseCategories.slug,
        iconKey: dbCourseCategories.iconKey,
        courseCount: count(dbCourses.id),
        sortOrder: dbCourseCategories.sortOrder,
      })
      .from(dbCourseCategories)
      .leftJoin(
        dbCourses,
        and(
          eq(dbCourses.category, dbCourseCategories.name),
          eq(dbCourses.status, "active"),
        ),
      )
      .where(eq(dbCourseCategories.isActive, true))
      .groupBy(
        dbCourseCategories.name,
        dbCourseCategories.slug,
        dbCourseCategories.iconKey,
        dbCourseCategories.sortOrder,
      )
      .orderBy(asc(dbCourseCategories.sortOrder), asc(dbCourseCategories.name));

    return rows
      .map((row) => ({
        name: row.name.trim(),
        slug: row.slug,
        iconKey: row.iconKey,
        courseCount: row.courseCount,
      }))
      .filter((category) => category.name.length > 0);
  }

  async findByIdActive(id: string): Promise<FlatCourseRecord | null> {
    const rows = await db
      .select({ course: courseColumns, instructor: instructorColumns })
      .from(dbCourses)
      .leftJoin(dbUsers, eq(sql`${dbCourses.instructorId}::text`, dbUsers.id))
      .where(and(eq(dbCourses.id, id), eq(dbCourses.status, "active")))
      .limit(1);

    const first = rows[0];
    return first ? mapCourseRecord(first) : null;
  }

  async findBySlugActive(slug: string): Promise<FlatCourseRecord | null> {
    const rows = await db
      .select({ course: courseColumns, instructor: instructorColumns })
      .from(dbCourses)
      .leftJoin(dbUsers, eq(sql`${dbCourses.instructorId}::text`, dbUsers.id))
      .where(and(eq(dbCourses.slug, slug), eq(dbCourses.status, "active")))
      .limit(1);

    const first = rows[0];
    return first ? mapCourseRecord(first) : null;
  }

  async incrementStudents(courseId: string) {
    const rows = await db
      .update(dbCourses)
      .set({
        studentsCount: sql`${dbCourses.studentsCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(dbCourses.id, courseId))
      .returning({ id: dbCourses.id, studentsCount: dbCourses.studentsCount });

    return rows[0] ?? null;
  }

  async findActiveSubscriptionsByUser(
    userId: string,
    courseIds: string[],
  ): Promise<Set<string>> {
    if (courseIds.length === 0) return new Set<string>();

    const rows = await db
      .select({ courseId: dbSubscriptions.courseId })
      .from(dbSubscriptions)
      .where(
        and(
          eq(sql`${dbSubscriptions.userId}::text`, userId),
          eq(dbSubscriptions.isActive, true),
          inArray(sql`${dbSubscriptions.courseId}::text`, courseIds),
        ),
      );

    return new Set(rows.map((row) => row.courseId));
  }

  async findActiveSubscription(userId: string, courseId: string) {
    const rows = await db
      .select({
        id: dbSubscriptions.id,
        courseId: dbSubscriptions.courseId,
        userId: dbSubscriptions.userId,
      })
      .from(dbSubscriptions)
      .where(
        and(
          eq(sql`${dbSubscriptions.userId}::text`, userId),
          eq(sql`${dbSubscriptions.courseId}::text`, courseId),
          eq(dbSubscriptions.isActive, true),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async createFreeSubscription(params: {
    userId: string;
    courseId: string;
    idempotencyKey?: string;
  }) {
    await db.insert(dbSubscriptions).values({
      userId: params.userId,
      courseId: params.courseId,
      amount: 0,
      status: "active",
      isActive: true,
      paymentId: params.idempotencyKey ?? "free-enrollment",
    });
  }

  async createInquiry(params: {
    courseId: string;
    userId: string;
    name: string;
    email: string;
    phone?: string;
    message?: string;
    sourceSurface?: string;
    idempotencyKey?: string;
  }) {
    const [row] = await db
      .insert(dbInquiries)
      .values({
        courseId: params.courseId,
        userId: params.userId,
        name: params.name,
        email: params.email,
        phone: params.phone ?? null,
        message: params.message ?? null,
        sourceSurface: params.sourceSurface ?? null,
        idempotencyKey: params.idempotencyKey ?? null,
        status: "pending",
      })
      .returning({ id: dbInquiries.id });

    return row;
  }

  async listLessons(courseId: string) {
    return db
      .select()
      .from(dbLessons)
      .where(
        and(
          eq(dbLessons.courseId, courseId),
          eq(dbLessons.isArchived, false),
          eq(dbLessons.status, "active"),
        ),
      )
      .orderBy(asc(dbLessons.sortIndex));
  }

  async findUserById(userId: string) {
    const rows = await db
      .select({
        id: dbUsers.id,
        isBlocked: dbUsers.banned,
      })
      .from(dbUsers)
      .where(eq(dbUsers.id, userId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findLessonProgress(userId: string, lessonId: string) {
    const rows = await db
      .select()
      .from(dbLessonProgress)
      .where(
        and(
          eq(dbLessonProgress.userId, userId),
          eq(dbLessonProgress.lessonId, lessonId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertLessonProgress(
    userId: string,
    lessonId: string,
    courseId: string,
    data: {
      completed?: boolean;
      completedAt?: Date | null;
      watchedPercentage?: number;
      lastPosition?: number;
    },
  ) {
    const existing = await this.findLessonProgress(userId, lessonId);

    if (existing) {
      const [row] = await db
        .update(dbLessonProgress)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(dbLessonProgress.id, existing.id))
        .returning();

      return row;
    }

    const [row] = await db
      .insert(dbLessonProgress)
      .values({
        userId,
        lessonId,
        courseId,
        completed: data.completed ?? false,
        completedAt: data.completedAt ?? null,
        watchedPercentage: data.watchedPercentage ?? 0,
        lastPosition: data.lastPosition ?? 0,
      })
      .returning();

    return row;
  }

  async findProgressByCourse(userId: string, courseId: string) {
    return db
      .select()
      .from(dbLessonProgress)
      .where(
        and(
          eq(dbLessonProgress.userId, userId),
          eq(dbLessonProgress.courseId, courseId),
        ),
      );
  }
}
