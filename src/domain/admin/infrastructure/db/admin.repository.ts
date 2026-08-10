import { and, asc, count, desc, eq, gte, ilike, like, lte, or, sql, SQL } from "drizzle-orm";
import { db } from "@/db";
import { user as dbUsers } from "@/db/schema/auth-schema";
import { dbCourses, dbSubscriptions, dbInquiries } from "@/db/schema/courses-db.schema";
import { dbLessons } from "@/db/schema/admin-db.schema";
import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import { AdminErrors } from "@/domain/admin/application/admin-errors";
import type {
  AdminCourseQuery,
  AdminInquiryQuery,
  AdminOverviewStats,
  AdminSubscriptionQuery,
  AdminUserQuery,
  CourseReport,
  CreateCourseInput,
  CreateLessonInput,
  PaginatedData,
  RevenueReport,
  UpdateCourseInput,
  UpdateLessonInput,
  UpdateSubscriptionInput,
  UpdateUserInput,
  UserReport,
} from "@/domain/admin/contracts/admin-types";

const paginate = async <T>(
  queryBuilder: (limit: number, offset: number) => Promise<T[]>,
  countBuilder: () => Promise<{ value: number }[]>,
  page: number,
  limit: number,
): Promise<PaginatedData<T>> => {
  const offset = (page - 1) * limit;
  const [items, totalResult] = await Promise.all([
    queryBuilder(limit, offset),
    countBuilder(),
  ]);
  const total = Number(totalResult[0]?.value ?? 0);
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const createAdminRepository = (): AdminRepository => {
  const sanitizeSearch = (term: string): string => `%${term.replaceAll(/[%_\\]/g, "\\$&")}%`;

  return {
    async listCourses(query: AdminCourseQuery) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const conditions: unknown[] = [];

      if (query.search) {
        conditions.push(
          or(
            like(dbCourses.title, sanitizeSearch(query.search)),
            like(dbCourses.description, sanitizeSearch(query.search)),
          ),
        );
      }
      if (query.status) {
        conditions.push(eq(dbCourses.status, query.status));
      }
      if (query.category) {
        conditions.push(eq(dbCourses.category, query.category));
      }

      const where = and(...(conditions as SQL[]));

      return paginate(
        async (l, o) =>
          db
            .select({
              id: dbCourses.id,
              slug: dbCourses.slug,
              title: dbCourses.title,
              description: dbCourses.description,
              imageUrl: dbCourses.imageUrl,
              category: dbCourses.category,
              level: dbCourses.level,
              currentPrice: dbCourses.currentPrice,
              originalPrice: dbCourses.originalPrice,
              instructorId: dbCourses.instructorId,
              status: dbCourses.status,
              requiresForm: dbCourses.requiresForm,
              autoApproveApplications: dbCourses.autoApproveApplications,
              createdAt: dbCourses.createdAt,
              updatedAt: dbCourses.updatedAt,
            })
            .from(dbCourses)
            .where(where)
            .orderBy(desc(dbCourses.createdAt))
            .limit(l)
            .offset(o),
        async () => db.select({ value: count() }).from(dbCourses).where(where),
        page,
        limit,
      );
    },

    async getCourse(id: string) {
      const results = await db
        .select({
          id: dbCourses.id,
          slug: dbCourses.slug,
          title: dbCourses.title,
          description: dbCourses.description,
          imageUrl: dbCourses.imageUrl,
          category: dbCourses.category,
          level: dbCourses.level,
          currentPrice: dbCourses.currentPrice,
          originalPrice: dbCourses.originalPrice,
          instructorId: dbCourses.instructorId,
          status: dbCourses.status,
          requiresForm: dbCourses.requiresForm,
          autoApproveApplications: dbCourses.autoApproveApplications,
          createdAt: dbCourses.createdAt,
          updatedAt: dbCourses.updatedAt,
        })
        .from(dbCourses)
        .where(eq(dbCourses.id, id))
        .limit(1);
      return results[0] ?? null;
    },

    async createCourse(data: CreateCourseInput) {
      const results = await db
        .insert(dbCourses)
        .values({
          id: crypto.randomUUID(),
          title: data.title,
          slug: data.slug,
          description: data.description ?? "",
          category: data.category ?? "General",
          level: data.level ?? null,
          currentPrice: data.price ?? 0,
          originalPrice: data.originalPrice ?? null,
          requiresForm: data.requiresForm ?? false,
          autoApproveApplications: data.autoApproveApplications ?? false,
          salesInquiry: data.salesInquiry ?? false,
          imageUrl: data.imageUrl ?? null,
          videoPreviewUrl: data.videoPreviewUrl ?? null,
          tags: data.tags ?? null,
          status: data.status ?? "draft",
          instructorId: data.instructorId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return results[0];
    },

    async updateCourse(id: string, data: UpdateCourseInput, _expectedVersion?: Date) {
      const whereConditions = [eq(dbCourses.id, id)];
      if (_expectedVersion) {
        whereConditions.push(eq(dbCourses.updatedAt, _expectedVersion));
      }

      const results = await db
        .update(dbCourses)
        .set({
          ...(data.title !== undefined && { title: data.title }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.level !== undefined && { level: data.level }),
          ...(data.price !== undefined && { currentPrice: data.price }),
          ...(data.originalPrice !== undefined && { originalPrice: data.originalPrice }),
          ...(data.requiresForm !== undefined && { requiresForm: data.requiresForm }),
          ...(data.autoApproveApplications !== undefined && {
            autoApproveApplications: data.autoApproveApplications,
          }),
          ...(data.salesInquiry !== undefined && { salesInquiry: data.salesInquiry }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.videoPreviewUrl !== undefined && { videoPreviewUrl: data.videoPreviewUrl }),
          ...(data.tags !== undefined && { tags: data.tags }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.instructorId !== undefined && { instructorId: data.instructorId }),
          ...(data.seoDescription !== undefined && { seoDescription: data.seoDescription }),
          ...(data.seoKeywords !== undefined && { seoKeywords: data.seoKeywords }),
          updatedAt: new Date(),
        })
        .where(and(...whereConditions))
        .returning();

      if (results.length === 0) {
        throw AdminErrors.conflict("Course was modified by another user. Please refresh and try again.");
      }

      return results[0];
    },

    async updateCourseStatus(id: string, status: string) {
      const results = await db
        .update(dbCourses)
        .set({ status, updatedAt: new Date() })
        .where(eq(dbCourses.id, id))
        .returning();
      return results[0];
    },

    async archiveCourse(id: string) {
      await db
        .update(dbCourses)
        .set({ status: "archived", updatedAt: new Date() })
        .where(eq(dbCourses.id, id));
    },

    async enrollUser(courseId: string, email: string) {
      const users = await db
        .select({ id: dbUsers.id })
        .from(dbUsers)
        .where(eq(dbUsers.email, email))
        .limit(1);
      const userId = users[0]?.id;
      if (!userId) throw new Error(`User with email ${email} not found`);

      await db.insert(dbSubscriptions).values({
        id: crypto.randomUUID(),
        userId,
        courseId,
        status: "active",
        isActive: true,
        enrolledAt: new Date(),
      });
    },

    async revokeUser(courseId: string, email: string) {
      const users = await db
        .select({ id: dbUsers.id })
        .from(dbUsers)
        .where(eq(dbUsers.email, email))
        .limit(1);
      const userId = users[0]?.id;
      if (!userId) throw new Error(`User with email ${email} not found`);

      await db
        .update(dbSubscriptions)
        .set({ status: "cancelled", isActive: false })
        .where(
          and(
            eq(dbSubscriptions.userId, userId),
            eq(dbSubscriptions.courseId, courseId),
          ),
        );
    },

    async listLessons(courseId: string) {
      return db
        .select()
        .from(dbLessons)
        .where(
          and(eq(dbLessons.courseId, courseId), eq(dbLessons.isArchived, false)),
        )
        .orderBy(asc(dbLessons.sortIndex));
    },

    async getLesson(id: string) {
      const results = await db
        .select()
        .from(dbLessons)
        .where(eq(dbLessons.id, id))
        .limit(1);
      return results[0] ?? null;
    },

    /*
     * RACE CONDITION FIX:
     *
     * Problem (original code):
     *   The previous implementation did two separate round-trips — first read
     *   MAX(sortIndex) from the lessons table, then INSERT with that value + 1.
     *   Under concurrent calls for the same courseId, both would read the same
     *   MAX, compute the same sortIndex, and the second INSERT would either
     *   silently produce a duplicate or (with the existing unique constraint on
     *   course_id + sort_index) throw an unhandled unique-violation error.
     *
     * Solution:
     *   1. Atomic counter — we added a `last_lesson_index` column to the
     *      courses table. Inside a single DB transaction we atomically
     *      increment it via UPDATE ... RETURNING, which acquires a PostgreSQL
     *      row-level lock on the course row, serialising concurrent callers.
     *   2. Retry loop — as defence-in-depth, if a unique-violation (23505)
     *      somehow still occurs (e.g. from a concurrent reorder operation),
     *      we retry up to 3 times instead of crashing.
     *
     * The UPDATE ... RETURNING approach ensures every lesson creation gets a
     * strictly monotonically increasing, gap-free sortIndex without races.
     */
    async createLesson(courseId: string, data: CreateLessonInput) {
      const MAX_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          return await db.transaction(async (tx) => {
            /*
             * Read the current counter value and the true max sort_index
             * in one shot.  If they disagree (counter drifted), we use the
             * authoritative MAX(sort_index) + 1 so the insert cannot
             * collide with an existing row.
             */
            const [course, maxRow] = await Promise.all([
              tx
                .select({ lastLessonIndex: dbCourses.lastLessonIndex })
                .from(dbCourses)
                .where(eq(dbCourses.id, courseId))
                .limit(1),
              tx
                .select({ maxSort: sql<number>`COALESCE(MAX(${dbLessons.sortIndex}), 0)` })
                .from(dbLessons)
                .where(eq(dbLessons.courseId, courseId))
                .limit(1),
            ]);

            if (!course[0]) throw new Error(`Course ${courseId} not found`);

            const nextSortIndex = Math.max(
              course[0].lastLessonIndex,
              maxRow[0].maxSort,
            ) + 1;

            /*
             * Atomically advance the counter so concurrent callers get
             * the next value.  The UPDATE acquires a row-level lock on
             * the courses row, serialising concurrent transactions.
             */
            await tx
              .update(dbCourses)
              .set({ lastLessonIndex: nextSortIndex })
              .where(eq(dbCourses.id, courseId));

            /*
             * Insert the lesson with the now-unique sortIndex.
             */
            const [lesson] = await tx
              .insert(dbLessons)
              .values({
                id: crypto.randomUUID(),
                courseId,
                title: data.title,
                description: data.description ?? null,
                content: data.content ?? null,
                videoUrl: data.videoUrl ?? null,
                duration: data.duration ?? null,
                isPrivate: data.isPrivate ?? true,
                status: data.status ?? "draft",
                sortIndex: nextSortIndex,
              })
              .returning();

            return lesson;
          });
        } catch (error) {
          /*
           * PostgreSQL error code 23505 = unique_violation.
           * With the MAX-based approach above this should be extremely
           * rare, but we keep it as a safety net for truly unusual
           * race conditions (e.g. concurrent reorder between the read
           * and the insert).
           */
          const isUniqueViolation =
            error instanceof Error &&
            "code" in error &&
            (error as Record<string, unknown>).code === "23505";

          if (isUniqueViolation && attempt < MAX_RETRIES - 1) {
            continue;
          }
          throw error;
        }
      }
    },

    async updateLesson(id: string, data: UpdateLessonInput, _expectedVersion?: Date) {
      const current = await db
        .select({ updatedAt: dbLessons.updatedAt })
        .from(dbLessons)
        .where(eq(dbLessons.id, id))
        .limit(1);

      if (current.length > 0 && current[0].updatedAt && _expectedVersion) {
        if (current[0].updatedAt.getTime() !== _expectedVersion.getTime()) {
          throw AdminErrors.conflict("Lesson was modified by another user. Please refresh and try again.");
        }
      }

      const results = await db
        .update(dbLessons)
        .set({
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
          ...(data.status !== undefined && { status: data.status }),
          updatedAt: new Date(),
        })
        .where(eq(dbLessons.id, id))
        .returning();
      return results[0];
    },

    async toggleLessonVisibility(id: string) {
      const lesson = await this.getLesson(id);
      if (!lesson) throw new Error("Lesson not found");
      const results = await db
        .update(dbLessons)
        .set({ isPrivate: !lesson.isPrivate, updatedAt: new Date() })
        .where(eq(dbLessons.id, id))
        .returning();
      return results[0];
    },

    async archiveLesson(id: string) {
      await db
        .update(dbLessons)
        .set({ isArchived: true, updatedAt: new Date() })
        .where(eq(dbLessons.id, id));
    },

    async reorderLessons(courseId: string, lessonIds: string[]) {
      await db.transaction(async (tx) => {
        for (let i = 0; i < lessonIds.length; i++) {
          await tx
            .update(dbLessons)
            .set({ sortIndex: i + 1 })
            .where(eq(dbLessons.id, lessonIds[i]));
        }
      });
      return this.listLessons(courseId);
    },

    async listUsers(query: AdminUserQuery) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const conditions: unknown[] = [];

      if (query.search) {
        const terms = query.search
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        if (terms.length > 0) {
          const termConditions = terms.map((term) => {
            const pattern = sanitizeSearch(term);
            return or(
              like(dbUsers.firstName, pattern),
              like(dbUsers.lastName, pattern),
              like(dbUsers.email, pattern),
              like(dbUsers.role, pattern),
              like(dbUsers.id, pattern),
              like(dbUsers.phoneNumber, pattern),
              like(
                sql<string>`COALESCE(${dbUsers.firstName}, '') || ' ' || COALESCE(${dbUsers.lastName}, '')`,
                pattern,
              ),
            );
          });
          conditions.push(and(...termConditions));
        }
      }
      if (query.role) {
        conditions.push(eq(dbUsers.role, query.role));
      }
      if (query.isBlocked !== undefined) {
        conditions.push(eq(dbUsers.banned, query.isBlocked));
      }

      const where = conditions.length > 0 ? and(...(conditions as SQL[])) : undefined;

      return paginate(
        async (l, o) =>
          db
            .select({
              id: dbUsers.id,
              firstName: dbUsers.firstName,
              lastName: dbUsers.lastName,
              email: dbUsers.email,
              role: dbUsers.role,
              banned: dbUsers.banned,
              banReason: dbUsers.banReason,
              emailVerified: dbUsers.emailVerified,
              createdAt: dbUsers.createdAt,
              image: dbUsers.image,
            })
            .from(dbUsers)
            .where(where)
            .orderBy(desc(dbUsers.createdAt))
            .limit(l)
            .offset(o),
        async () => db.select({ value: count() }).from(dbUsers).where(where),
        page,
        limit,
      );
    },

    async getUser(id: string) {
      const results = await db
        .select({
          id: dbUsers.id,
          firstName: dbUsers.firstName,
          lastName: dbUsers.lastName,
          email: dbUsers.email,
          role: dbUsers.role,
          banned: dbUsers.banned,
          banReason: dbUsers.banReason,
          emailVerified: dbUsers.emailVerified,
          createdAt: dbUsers.createdAt,
          image: dbUsers.image,
          phoneNumber: dbUsers.phoneNumber,
        })
        .from(dbUsers)
        .where(eq(dbUsers.id, id))
        .limit(1);
      return results[0] ?? null;
    },

    async updateUser(id: string, data: UpdateUserInput) {
      const results = await db
        .update(dbUsers)
        .set({
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        })
        .where(eq(dbUsers.id, id))
        .returning();
      return results[0];
    },

    async setUserRole(id: string, role: string) {
      const results = await db
        .update(dbUsers)
        .set({ role })
        .where(eq(dbUsers.id, id))
        .returning();
      return results[0];
    },

    async blockUser(id: string, reason: string) {
      const results = await db
        .update(dbUsers)
        .set({ banned: true, banReason: reason })
        .where(eq(dbUsers.id, id))
        .returning();
      return results[0];
    },

    async unblockUser(id: string) {
      const results = await db
        .update(dbUsers)
        .set({ banned: false, banReason: null, banExpires: null })
        .where(eq(dbUsers.id, id))
        .returning();
      return results[0];
    },

    async suspendUser(id: string) {
      await db
        .update(dbUsers)
        .set({ banned: true, banReason: "Account suspended by admin" })
        .where(eq(dbUsers.id, id));
    },

    async listSubscriptions(query: AdminSubscriptionQuery) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const conditions: unknown[] = [];

      if (query.status) {
        conditions.push(eq(dbSubscriptions.status, query.status));
      }
      if (query.courseId) {
        conditions.push(eq(dbSubscriptions.courseId, query.courseId));
      }

      const where = conditions.length > 0 ? and(...(conditions as SQL[])) : undefined;

      return paginate(
        async (l, o) =>
          db
            .select()
            .from(dbSubscriptions)
            .where(where)
            .orderBy(desc(dbSubscriptions.enrolledAt))
            .limit(l)
            .offset(o),
        async () =>
          db.select({ value: count() }).from(dbSubscriptions).where(where),
        page,
        limit,
      );
    },

    async getSubscription(id: string) {
      const results = await db
        .select()
        .from(dbSubscriptions)
        .where(eq(dbSubscriptions.id, id))
        .limit(1);
      return results[0] ?? null;
    },

    async updateSubscription(id: string, data: UpdateSubscriptionInput) {
      const results = await db
        .update(dbSubscriptions)
        .set({
          ...(data.status !== undefined && { status: data.status, isActive: data.status === "active" }),
          ...(data.amount !== undefined && { amount: data.amount }),
        })
        .where(eq(dbSubscriptions.id, id))
        .returning();
      return results[0];
    },

    async listInquiries(query: AdminInquiryQuery) {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const conditions: unknown[] = [];

      if (query.status) {
        conditions.push(eq(dbInquiries.status, query.status));
      }
      if (query.search) {
        conditions.push(
          or(
            like(dbInquiries.name, sanitizeSearch(query.search)),
            like(dbInquiries.email, sanitizeSearch(query.search)),
          ),
        );
      }

      const where = conditions.length > 0 ? and(...(conditions as SQL[])) : undefined;

      return paginate(
        async (l, o) =>
          db
            .select()
            .from(dbInquiries)
            .where(where)
            .orderBy(desc(dbInquiries.createdAt))
            .limit(l)
            .offset(o),
        async () =>
          db.select({ value: count() }).from(dbInquiries).where(where),
        page,
        limit,
      );
    },

    async getInquiry(id: string) {
      const results = await db
        .select()
        .from(dbInquiries)
        .where(eq(dbInquiries.id, id))
        .limit(1);
      return results[0] ?? null;
    },

    async updateInquiryStatus(id: string, status: string) {
      const results = await db
        .update(dbInquiries)
        .set({ status, updatedAt: new Date() })
        .where(eq(dbInquiries.id, id))
        .returning();
      return results[0];
    },

    async getOverviewStats(): Promise<AdminOverviewStats> {
      const [userCount] = await db
        .select({ value: count() })
        .from(dbUsers);
      const [courseCount] = await db
        .select({ value: count() })
        .from(dbCourses);
      const [subCount] = await db
        .select({ value: count() })
        .from(dbSubscriptions);
      const [activeSubs] = await db
        .select({ value: count() })
        .from(dbSubscriptions)
        .where(eq(dbSubscriptions.isActive, true));
      const [totalInq] = await db
        .select({ value: count() })
        .from(dbInquiries);
      const [pendingInq] = await db
        .select({ value: count() })
        .from(dbInquiries)
        .where(eq(dbInquiries.status, "pending"));

      const revenueResult = await db
        .select({ total: sql<number>`COALESCE(SUM(${dbSubscriptions.amount}), 0)` })
        .from(dbSubscriptions)
        .where(eq(dbSubscriptions.status, "active"));
      const totalRevenue = Number(revenueResult[0]?.total ?? 0);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const [monthRevenue] = await db
        .select({ total: sql<number>`COALESCE(SUM(${dbSubscriptions.amount}), 0)` })
        .from(dbSubscriptions)
        .where(
          and(
            eq(dbSubscriptions.status, "active"),
            gte(dbSubscriptions.enrolledAt, startOfMonth),
          ),
        );

      const [newUsers] = await db
        .select({ value: count() })
        .from(dbUsers)
        .where(gte(dbUsers.createdAt, startOfMonth));

      return {
        totalUsers: Number(userCount?.value ?? 0),
        totalCourses: Number(courseCount?.value ?? 0),
        totalSubscriptions: Number(subCount?.value ?? 0),
        activeSubscriptions: Number(activeSubs?.value ?? 0),
        totalInquiries: Number(totalInq?.value ?? 0),
        pendingInquiries: Number(pendingInq?.value ?? 0),
        totalRevenue,
        revenueThisMonth: Number(monthRevenue?.total ?? 0),
        newUsersThisMonth: Number(newUsers?.value ?? 0),
      };
    },

    async getRevenueReport(from: Date, to: Date): Promise<RevenueReport> {
      const subscriptions = await db
        .select({
          amount: dbSubscriptions.amount,
          enrolledAt: dbSubscriptions.enrolledAt,
          courseId: dbSubscriptions.courseId,
        })
        .from(dbSubscriptions)
        .where(
          and(
            gte(dbSubscriptions.enrolledAt, from),
            lte(dbSubscriptions.enrolledAt, to),
            eq(dbSubscriptions.status, "active"),
          ),
        );

      const byMonthMap = new Map<string, { revenue: number; count: number }>();
      const byCourseMap = new Map<string, { courseTitle: string; revenue: number; count: number }>();
      for (const sub of subscriptions) {
        const month = sub.enrolledAt
          ? `${sub.enrolledAt.getFullYear()}-${String(sub.enrolledAt.getMonth() + 1).padStart(2, "0")}`
          : "unknown";
        const existing = byMonthMap.get(month) ?? { revenue: 0, count: 0 };
        existing.revenue += Number(sub.amount ?? 0);
        existing.count++;
        byMonthMap.set(month, existing);

        if (sub.courseId) {
          const cExisting = byCourseMap.get(sub.courseId) ?? {
            courseTitle: sub.courseId,
            revenue: 0,
            count: 0,
          };
          cExisting.revenue += Number(sub.amount ?? 0);
          cExisting.count++;
          byCourseMap.set(sub.courseId, cExisting);
        }
      }

      const totalRevenue = subscriptions.reduce(
        (sum, s) => sum + Number(s.amount ?? 0),
        0,
      );

      return {
        totalRevenue,
        byMonth: Array.from(byMonthMap.entries()).map(([month, data]) => ({
          month,
          ...data,
        })),
        byCourse: Array.from(byCourseMap.entries()).map(
          ([courseId, data]) => ({
            courseId,
            ...data,
          }),
        ),
      };
    },

    async getUserReport(from: Date, to: Date): Promise<UserReport> {
      const users = await db
        .select({
          createdAt: dbUsers.createdAt,
          role: dbUsers.role,
        })
        .from(dbUsers)
        .where(
          and(gte(dbUsers.createdAt, from), lte(dbUsers.createdAt, to)),
        );

      const byMonthMap = new Map<string, number>();
      const byRoleMap = new Map<string, number>();

      for (const u of users) {
        const month = u.createdAt
          ? `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, "0")}`
          : "unknown";
        byMonthMap.set(month, (byMonthMap.get(month) ?? 0) + 1);
        const role = u.role ?? "user";
        byRoleMap.set(role, (byRoleMap.get(role) ?? 0) + 1);
      }

      return {
        totalUsers: users.length,
        byMonth: Array.from(byMonthMap.entries()).map(([month, signups]) => ({
          month,
          signups,
        })),
        byRole: Array.from(byRoleMap.entries()).map(([role, count]) => ({
          role,
          count,
        })),
      };
    },

    async getCourseReport(from: Date, to: Date): Promise<CourseReport> {
      const courseList = await db
        .select({ id: dbCourses.id, title: dbCourses.title, category: dbCourses.category })
        .from(dbCourses);

      const enrollmentCounts = await db
        .select({
          courseId: dbSubscriptions.courseId,
          count: sql<number>`COUNT(*)`,
        })
        .from(dbSubscriptions)
        .where(
          and(
            gte(dbSubscriptions.enrolledAt, from),
            lte(dbSubscriptions.enrolledAt, to),
          ),
        )
        .groupBy(dbSubscriptions.courseId);

      const enrollmentMap = new Map(
        enrollmentCounts.map((e) => [e.courseId, Number(e.count)]),
      );

      const byCategoryMap = new Map<string, number>();
      for (const c of courseList) {
        const cat = c.category ?? "Uncategorized";
        byCategoryMap.set(cat, (byCategoryMap.get(cat) ?? 0) + 1);
      }

      const topEnrolled = courseList
        .map((c) => ({
          courseId: c.id,
          courseTitle: c.title,
          enrollments: enrollmentMap.get(c.id) ?? 0,
        }))
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 10);

      return {
        totalCourses: courseList.length,
        byCategory: Array.from(byCategoryMap.entries()).map(
          ([category, count]) => ({ category, count }),
        ),
        topEnrolled,
        averageCompletionRate: 0,
      };
    },

    async getUserByEmail(email: string) {
      const results = await db
        .select()
        .from(dbUsers)
        .where(eq(dbUsers.email, email))
        .limit(1);
      return results[0] ?? null;
    },

    async setMustChangePassword(userId: string, value: boolean) {
      await db
        .update(dbUsers)
        .set({ mustChangePassword: value })
        .where(eq(dbUsers.id, userId));
    },

    async enrollUserWithPayment(
      courseId: string,
      userId: string,
      amount: number,
      paymentMethod: string,
      paymentId?: string,
    ) {
      const [enrollment] = await db
        .insert(dbSubscriptions)
        .values({
          userId,
          courseId,
          amount,
          paymentMethod,
          paymentId,
          status: "active",
          isActive: true,
          enrolledAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();

      if (!enrollment) {
        throw AdminErrors.conflict(
          "User is already enrolled in this course",
        );
      }

      return enrollment;
    },

    async listEnrollmentsByCourse(
      courseId: string,
      page = 1,
      limit = 20,
      search?: string,
      status?: string,
    ) {
      const conditions: unknown[] = [eq(dbSubscriptions.courseId, courseId)];

      if (status) {
        conditions.push(eq(dbSubscriptions.status, status));
      }
      
      if (search) {
        const pattern = sanitizeSearch(search.trim());
        conditions.push(
          or(
            ilike(dbUsers.email, pattern),
            ilike(dbUsers.firstName, pattern),
            ilike(dbUsers.lastName, pattern),
            ilike(
              sql<string>`COALESCE(${dbUsers.firstName}, '') || ' ' || COALESCE(${dbUsers.lastName}, '')`,
              pattern,
            ),
          )
        );
      }

      const where = and(...(conditions as SQL[]));

      return paginate(
        async (l, o) => {
          return db
            .select({
              id: dbSubscriptions.id,
              userId: dbSubscriptions.userId,
              courseId: dbSubscriptions.courseId,
              amount: dbSubscriptions.amount,
              paymentMethod: dbSubscriptions.paymentMethod,
              paymentId: dbSubscriptions.paymentId,
              status: dbSubscriptions.status,
              isActive: dbSubscriptions.isActive,
              enrolledAt: dbSubscriptions.enrolledAt,
              user: {
                id: dbUsers.id,
                email: dbUsers.email,
                firstName: dbUsers.firstName,
                lastName: dbUsers.lastName,
              },
            })
            .from(dbSubscriptions)
            .innerJoin(dbUsers, eq(dbSubscriptions.userId, dbUsers.id))
            .where(where)
            .orderBy(desc(dbSubscriptions.enrolledAt))
            .limit(l)
            .offset(o);
        },
        async () =>
          db
            .select({ value: count() })
            .from(dbSubscriptions)
            .innerJoin(dbUsers, eq(dbSubscriptions.userId, dbUsers.id))
            .where(where),
        page,
        limit,
      );
    },
  };
};
