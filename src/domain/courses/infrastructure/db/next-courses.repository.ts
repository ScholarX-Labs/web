import { and, asc, count, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCourses,
  dbInquiries,
  dbSubscriptions,
  dbUsers,
} from "@/domain/courses/infrastructure/db/courses-db.schema";

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
  id: row.course.id,
  slug: row.course.slug,
  title: row.course.title,
  description: row.course.description,
  imageUrl: row.course.imageUrl,
  videoPreviewUrl: row.course.videoPreviewUrl,
  category: row.course.category,
  level: row.course.level,
  currentPrice: row.course.currentPrice,
  originalPrice: row.course.originalPrice,
  status: row.course.status,
  rating: row.course.rating,
  totalRatings: row.course.totalRatings,
  duration: row.course.duration,
  lessonsCount: row.course.lessonsCount,
  videosCount: row.course.videosCount,
  studentsCount: row.course.studentsCount,
  isBestseller: row.course.isBestseller,
  urgencyText: row.course.urgencyText,
  tags: row.course.tags,
  requiresForm: row.course.requiresForm,
  createdAt: row.course.createdAt ? row.course.createdAt.toISOString() : null,
  updatedAt: row.course.updatedAt ? row.course.updatedAt.toISOString() : null,
  instructor: row.instructor
    ? {
        id: row.instructor.id,
        name: row.instructor.name,
        avatar: row.instructor.image,
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
}
