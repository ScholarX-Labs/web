import { and, count, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { session as dbSessions, user as dbUsers } from "@/db/schema/auth-schema";
import { adminAuditLog } from "@/db/schema/admin-db.schema";
import { dbLessons } from "@/db/schema/admin-db.schema";
import {
  dbCourseProgress,
  dbCourses,
  dbInquiries,
  dbLessonProgress,
  dbProgressSyncEvents,
  dbSubscriptions,
} from "@/db/schema/courses-db.schema";
import {
  dbEmailDeliveries,
  dbEmailProviderCircuitStates,
} from "@/db/schema/email-db.schema";
import {
  dbExecutiveActionItemStates,
  dbExecutiveAnalyticsEvents,
  dbExecutiveMetricFreshness,
  dbExecutivePublicImpactMetrics,
} from "@/db/schema/executive-analytics.schema";
import {
  getAiSearchAnalyticsSnapshot,
  getWebsiteAnalyticsSnapshot,
} from "./analytics-event.repository";
import type {
  PublicImpactGovernanceRepository,
  PublicImpactMetricDraft,
} from "@/domain/executive/application/public-impact-governance.service";
import { createExecutiveDashboardService } from "@/domain/executive/application/executive-dashboard.service";
import type {
  OverviewAggregateSnapshot,
  CoursesLessonsAggregateSnapshot,
  GrowthFunnelSnapshot,
  InquiryPipelineSnapshot,
  OpportunityQualitySnapshot,
  TechnicalAuditSnapshot,
  TechnicalFreshnessSnapshot,
  TechnicalHealthSnapshot,
  OverviewTrendSnapshot,
  UsersActivityEventSnapshot,
  UsersAggregateSnapshot,
  UsersMonthlyActivitySnapshot,
  UsersRoleSnapshot,
  UsersTrendSnapshot,
} from "@/domain/executive/application/executive-dashboard.service";
import type {
  CourseLeaderboardRow,
  CoursesLessonsReadModel,
  EmptyExecutiveSections,
  ExecutivePageResponse,
  ExecutiveReadRepository,
  FinanceReadModel,
  LearnerProgressReadModel,
  LessonAnalyticsRow,
  LessonDrilldownReadModel,
  OpportunitiesAiReadModel,
  OverviewReadModel,
  PublicGrowthReadModel,
  PublicImpactAuditEntry,
  PublicImpactMetricGovernanceRow,
  TeamOperationsReadModel,
  TechnicalHealthReadModel,
  UsersReadModel,
} from "@/domain/executive/contracts/executive-read-repository.contract";
import type { ExecutivePageQuery } from "@/domain/executive/contracts/executive-query.schemas";
import type { ExecutivePageId } from "@/domain/executive/contracts/executive-types";

const emptyFreshnessSummary = {
  current: 0,
  stale: 0,
  very_stale: 0,
  unavailable: 0,
} as const;

function emptyPageResponse(
  pageId: ExecutivePageId,
  query: ExecutivePageQuery,
): ExecutivePageResponse<EmptyExecutiveSections> {
  return {
    pageId,
    query,
    generatedAt: new Date().toISOString(),
    sections: {},
    freshnessSummary: emptyFreshnessSummary,
    redactionNotes: [],
  };
}

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateEnd(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

function numeric(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value) || 0;
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeAuditTrail(value: unknown): readonly PublicImpactAuditEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is PublicImpactAuditEntry => {
    if (!entry || typeof entry !== "object") return false;
    const candidate = entry as Partial<PublicImpactAuditEntry>;
    return typeof candidate.action === "string"
      && typeof candidate.actorId === "string"
      && typeof candidate.at === "string"
      && typeof candidate.toStatus === "string";
  });
}

async function executeRows<T extends Record<string, unknown>>(
  query: Parameters<typeof db.execute>[0],
): Promise<T[]> {
  const result = (await db.execute(query)) as { rows?: T[] } | T[];
  return Array.isArray(result) ? result : (result.rows ?? []);
}

export class DrizzleExecutiveReadRepository implements ExecutiveReadRepository {
  private readonly dashboard = createExecutiveDashboardService();

  async getOverview(query: ExecutivePageQuery): Promise<OverviewReadModel> {
    const from = toDate(query.from);
    const to = toDateEnd(query.to);
    const dayMs = 86_400_000;
    const periodDays =
      Math.max(1, Math.floor((toDate(query.to).getTime() - from.getTime()) / dayMs) + 1);
    const previousTo = new Date(from.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - (periodDays - 1) * dayMs);

    const [current, previous, trends] = await Promise.all([
      this.getOverviewAggregate(from, to),
      this.getOverviewAggregate(previousFrom, previousTo),
      this.getOverviewTrends(from, to),
    ]);

    return this.dashboard.buildOverviewReadModel({
      query,
      current,
      previous,
      trends,
    });
  }

  private async getOverviewAggregate(
    from: Date,
    to: Date,
  ): Promise<OverviewAggregateSnapshot> {
    const [
      revenueRows,
      activeSubscriptionRows,
      cancelledSubscriptionRows,
      userRows,
      completionRows,
      activeCourseRows,
    ] = await Promise.all([
      db
        .select({
          grossRevenue: sql<string>`coalesce(sum(${dbSubscriptions.amount}), 0)`,
          subscriptions: count(),
        })
        .from(dbSubscriptions)
        .where(
          and(
            gte(dbSubscriptions.enrolledAt, from),
            lte(dbSubscriptions.enrolledAt, to),
          ),
        ),
      db
        .select({ value: count() })
        .from(dbSubscriptions)
        .where(
          and(
            gte(dbSubscriptions.enrolledAt, from),
            lte(dbSubscriptions.enrolledAt, to),
            eq(dbSubscriptions.isActive, true),
          ),
        ),
      db
        .select({ value: count() })
        .from(dbSubscriptions)
        .where(
          and(
            gte(dbSubscriptions.enrolledAt, from),
            lte(dbSubscriptions.enrolledAt, to),
            inArray(dbSubscriptions.status, ["cancelled", "refunded"]),
          ),
        ),
      db
        .select({ value: count() })
        .from(dbUsers)
        .where(and(gte(dbUsers.createdAt, from), lte(dbUsers.createdAt, to))),
      db
        .select({ value: count() })
        .from(dbCourseProgress)
        .where(
          and(
            eq(dbCourseProgress.status, "completed"),
            gte(dbCourseProgress.completedAt, from),
            lte(dbCourseProgress.completedAt, to),
          ),
        ),
      db
        .select({ value: count() })
        .from(dbCourses)
        .where(inArray(dbCourses.status, ["active", "published"])),
    ]);

    return {
      grossRevenue: numeric(revenueRows[0]?.grossRevenue),
      subscriptions: numeric(revenueRows[0]?.subscriptions),
      activeSubscriptions: numeric(activeSubscriptionRows[0]?.value),
      cancelledSubscriptions: numeric(cancelledSubscriptionRows[0]?.value),
      users: numeric(userRows[0]?.value),
      courseCompletions: numeric(completionRows[0]?.value),
      activeCourses: numeric(activeCourseRows[0]?.value),
    };
  }

  private async getOverviewTrends(
    from: Date,
    to: Date,
  ): Promise<OverviewTrendSnapshot[]> {
    const rows = await executeRows<{
      date: string;
      revenue: string | number | null;
      completions: string | number | null;
    }>(sql`
      with days as (
        select generate_series(
          ${from}::timestamp,
          ${to}::timestamp,
          interval '1 day'
        )::date as date
      ),
      revenue as (
        select date_trunc('day', enrolled_at)::date as date,
               coalesce(sum(amount), 0) as revenue
        from courses.subscriptions
        where enrolled_at between ${from} and ${to}
        group by 1
      ),
      completions as (
        select date_trunc('day', completed_at)::date as date,
               count(*) as completions
        from courses.course_progress
        where status = 'completed'
          and completed_at between ${from} and ${to}
        group by 1
      )
      select days.date::text as date,
             coalesce(revenue.revenue, 0) as revenue,
             coalesce(completions.completions, 0) as completions
      from days
      left join revenue on revenue.date = days.date
      left join completions on completions.date = days.date
      order by days.date asc
    `);

    return rows.map((row) => ({
      date: row.date,
      revenue: numeric(row.revenue),
      completions: numeric(row.completions),
    }));
  }

  async getUsers(query: ExecutivePageQuery): Promise<UsersReadModel> {
    const from = toDate(query.from);
    const to = toDateEnd(query.to);
    const dayMs = 86_400_000;
    const periodDays =
      Math.max(1, Math.floor((toDate(query.to).getTime() - from.getTime()) / dayMs) + 1);
    const previousTo = new Date(from.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - (periodDays - 1) * dayMs);

    const [current, previous, registrationTrend, roleDistribution, activityEvents, monthlyActivity] =
      await Promise.all([
        this.getUsersAggregate(from, to, query.userRole),
        this.getUsersAggregate(previousFrom, previousTo, query.userRole),
        this.getUserRegistrationTrend(from, to, query.userRole),
        this.getUserRoleDistribution(query.userRole),
        this.getUserActivityEvents(from, to, query.userRole),
        this.getMonthlyActivity(from, to, query.userRole),
      ]);

    return this.dashboard.buildUsersReadModel({
      query,
      current,
      previous,
      registrationTrend,
      roleDistribution,
      activityEvents,
      monthlyActivity,
    });
  }

  private async getUsersAggregate(
    from: Date,
    to: Date,
    role?: string,
  ): Promise<UsersAggregateSnapshot> {
    const roleFilter = role ? eq(dbUsers.role, role) : undefined;
    const createdInRange = and(
      gte(dbUsers.createdAt, from),
      lte(dbUsers.createdAt, to),
      roleFilter,
    );
    const allUsersFilter = roleFilter ? and(roleFilter) : undefined;

    const [newUserRows, totalRows, activeRows, verifiedRows, bannedRows] =
      await Promise.all([
        db.select({ value: count() }).from(dbUsers).where(createdInRange),
        db.select({ value: count() }).from(dbUsers).where(allUsersFilter),
        executeRows<{ value: string | number }>(sql`
          select count(distinct pse.user_id) as value
          from courses.progress_sync_events pse
          inner join auth.user u on u.id = pse.user_id
          where pse.created_at between ${from} and ${to}
            and (${role ?? null}::text is null or u.role = ${role ?? null})
        `),
        db
          .select({ value: count() })
          .from(dbUsers)
          .where(and(eq(dbUsers.emailVerified, true), allUsersFilter)),
        db
          .select({ value: count() })
          .from(dbUsers)
          .where(and(eq(dbUsers.banned, true), allUsersFilter)),
      ]);

    return {
      newUsers: numeric(newUserRows[0]?.value),
      totalUsers: numeric(totalRows[0]?.value),
      activeUsers: numeric(activeRows[0]?.value),
      verifiedUsers: numeric(verifiedRows[0]?.value),
      bannedUsers: numeric(bannedRows[0]?.value),
    };
  }

  private async getUserRegistrationTrend(
    from: Date,
    to: Date,
    role?: string,
  ): Promise<UsersTrendSnapshot[]> {
    const rows = await executeRows<{ date: string; new_users: string | number }>(sql`
      with days as (
        select generate_series(
          ${from}::timestamp,
          ${to}::timestamp,
          interval '1 day'
        )::date as date
      ),
      registrations as (
        select date_trunc('day', created_at)::date as date,
               count(*) as new_users
        from auth.user
        where created_at between ${from} and ${to}
          and (${role ?? null}::text is null or role = ${role ?? null})
        group by 1
      )
      select days.date::text as date,
             coalesce(registrations.new_users, 0) as new_users
      from days
      left join registrations on registrations.date = days.date
      order by days.date asc
    `);

    return rows.map((row) => ({
      date: row.date,
      newUsers: numeric(row.new_users),
    }));
  }

  private async getUserRoleDistribution(
    role?: string,
  ): Promise<UsersRoleSnapshot[]> {
    const rows = await db
      .select({
        role: dbUsers.role,
        value: count(),
      })
      .from(dbUsers)
      .where(role ? eq(dbUsers.role, role) : undefined)
      .groupBy(dbUsers.role);

    return rows.map((row) => ({
      role: row.role,
      value: numeric(row.value),
    }));
  }

  private async getUserActivityEvents(
    from: Date,
    to: Date,
    role?: string,
  ): Promise<UsersActivityEventSnapshot[]> {
    const rows = await executeRows<{ occurred_at: Date | string }>(sql`
      select pse.created_at as occurred_at
      from courses.progress_sync_events pse
      inner join auth.user u on u.id = pse.user_id
      where pse.created_at between ${from} and ${to}
        and (${role ?? null}::text is null or u.role = ${role ?? null})
      order by pse.created_at asc
      limit 50000
    `);

    return rows.map((row) => ({ occurredAt: row.occurred_at }));
  }

  private async getMonthlyActivity(
    from: Date,
    to: Date,
    role?: string,
  ): Promise<UsersMonthlyActivitySnapshot[]> {
    const rows = await executeRows<{ month: string; value: string | number }>(sql`
      select to_char(date_trunc('month', pse.created_at), 'YYYY-MM') as month,
             count(*) as value
      from courses.progress_sync_events pse
      inner join auth.user u on u.id = pse.user_id
      where pse.created_at between ${from} and ${to}
        and (${role ?? null}::text is null or u.role = ${role ?? null})
      group by 1
      order by 1 asc
    `);

    return rows.map((row) => ({
      month: row.month,
      value: numeric(row.value),
    }));
  }

  async getCoursesLessons(
    query: ExecutivePageQuery,
  ): Promise<CoursesLessonsReadModel> {
    const from = toDate(query.from);
    const to = toDateEnd(query.to);
    const dayMs = 86_400_000;
    const periodDays =
      Math.max(1, Math.floor((toDate(query.to).getTime() - from.getTime()) / dayMs) + 1);
    const previousTo = new Date(from.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - (periodDays - 1) * dayMs);
    const [current, previous, leaderboard, categoryDistribution] = await Promise.all([
      this.getCoursesLessonsAggregate(from, to, query.courseCategory),
      this.getCoursesLessonsAggregate(previousFrom, previousTo, query.courseCategory),
      this.getCourseLeaderboard(from, to, query),
      this.getCourseCategoryDistribution(query.courseCategory),
    ]);

    return this.dashboard.buildCoursesLessonsReadModel({
      query,
      current,
      previous,
      leaderboard,
      categoryDistribution,
    });
  }

  async getLessonDrilldown(
    query: ExecutivePageQuery,
    courseId: string,
  ): Promise<LessonDrilldownReadModel> {
    const lessons = await this.getLessonAnalytics(courseId);
    return this.dashboard.buildLessonDrilldownReadModel({
      query,
      courseId,
      lessons,
    });
  }

  private async getCoursesLessonsAggregate(
    from: Date,
    to: Date,
    category?: string,
  ): Promise<CoursesLessonsAggregateSnapshot> {
    const categoryFilter = category ? eq(dbCourses.category, category) : undefined;
    const [courseRows, activeRows, lessonRows, enrollmentRows, completionRows] =
      await Promise.all([
        db.select({ value: count() }).from(dbCourses).where(categoryFilter),
        db
          .select({ value: count() })
          .from(dbCourses)
          .where(and(inArray(dbCourses.status, ["active", "published"]), categoryFilter)),
        db
          .select({ value: count() })
          .from(dbLessons)
          .innerJoin(dbCourses, eq(dbLessons.courseId, dbCourses.id))
          .where(and(eq(dbLessons.isArchived, false), categoryFilter)),
        executeRows<{ value: string | number }>(sql`
          select count(*) as value
          from courses.subscriptions s
          inner join courses.courses c on c.id = s.course_id
          where s.enrolled_at between ${from} and ${to}
            and (${category ?? null}::text is null or c.category = ${category ?? null})
        `),
        executeRows<{ value: string | number }>(sql`
          select count(*) as value
          from courses.course_progress cp
          inner join courses.courses c on c.id = cp.course_id
          where cp.status = 'completed'
            and cp.completed_at between ${from} and ${to}
            and (${category ?? null}::text is null or c.category = ${category ?? null})
        `),
      ]);

    return {
      totalCourses: numeric(courseRows[0]?.value),
      activeCourses: numeric(activeRows[0]?.value),
      totalLessons: numeric(lessonRows[0]?.value),
      totalEnrollments: numeric(enrollmentRows[0]?.value),
      totalCompletions: numeric(completionRows[0]?.value),
    };
  }

  private async getCourseLeaderboard(
    from: Date,
    to: Date,
    query: ExecutivePageQuery,
  ): Promise<CourseLeaderboardRow[]> {
    const rows = await executeRows<{
      course_id: string;
      title: string;
      category: string;
      status: string;
      enrollments: string | number;
      completions: string | number;
      revenue: string | number;
    }>(sql`
      select c.id::text as course_id,
             c.title,
             c.category,
             c.status,
             count(distinct s.id) as enrollments,
             count(distinct cp.id) filter (where cp.status = 'completed') as completions,
             coalesce(sum(s.amount), 0) as revenue
      from courses.courses c
      left join courses.subscriptions s
        on s.course_id = c.id and s.enrolled_at between ${from} and ${to}
      left join courses.course_progress cp
        on cp.course_id = c.id and cp.completed_at between ${from} and ${to}
      where (${query.courseCategory ?? null}::text is null or c.category = ${query.courseCategory ?? null})
      group by c.id, c.title, c.category, c.status
      order by enrollments desc, revenue desc
      limit ${query.pageSize}
      offset ${(query.page - 1) * query.pageSize}
    `);

    return rows.map((row) => {
      const enrollments = numeric(row.enrollments);
      const completions = numeric(row.completions);
      return {
        courseId: row.course_id,
        title: row.title,
        category: row.category,
        status: row.status,
        enrollments,
        completions,
        completionRate: enrollments > 0 ? completions / enrollments : null,
        revenue: numeric(row.revenue),
      };
    });
  }

  private async getCourseCategoryDistribution(
    category?: string,
  ): Promise<readonly { category: string; value: number }[]> {
    const rows = await db
      .select({ category: dbCourses.category, value: count() })
      .from(dbCourses)
      .where(category ? eq(dbCourses.category, category) : undefined)
      .groupBy(dbCourses.category);

    return rows.map((row) => ({
      category: row.category,
      value: numeric(row.value),
    }));
  }

  private async getLessonAnalytics(
    courseId: string,
  ): Promise<readonly Omit<LessonAnalyticsRow, "completionRate" | "state">[]> {
    const rows = await executeRows<{
      lesson_id: string;
      title: string;
      sort_index: string | number;
      viewers: string | number;
      completions: string | number;
      average_watched_percentage: string | number | null;
    }>(sql`
      select l.id::text as lesson_id,
             l.title,
             l.sort_index,
             count(distinct lp.user_id) as viewers,
             count(distinct lp.user_id) filter (where lp.completed = true) as completions,
             avg(lp.watched_percentage) as average_watched_percentage
      from courses.lessons l
      left join courses.lesson_progress lp on lp.lesson_id = l.id
      where l.course_id = ${courseId}::uuid
        and l.is_archived = false
      group by l.id, l.title, l.sort_index
      order by l.sort_index asc
    `);

    return rows.map((row) => ({
      lessonId: row.lesson_id,
      title: row.title,
      sortIndex: numeric(row.sort_index),
      viewers: numeric(row.viewers),
      completions: numeric(row.completions),
      averageWatchedPercentage:
        row.average_watched_percentage === null
          ? null
          : numeric(row.average_watched_percentage),
    }));
  }

  async getLearnerProgress(
    query: ExecutivePageQuery,
  ): Promise<LearnerProgressReadModel> {
    return emptyPageResponse("learner_progress", query);
  }

  async getOpportunitiesAi(
    query: ExecutivePageQuery,
  ): Promise<OpportunitiesAiReadModel> {
    const from = toDate(query.from);
    const to = toDateEnd(query.to);
    const [opportunities, aiSearch] = await Promise.all([
      this.getOpportunityQualitySnapshots(from, to),
      getAiSearchAnalyticsSnapshot(from, to),
    ]);
    return this.dashboard.buildOpportunitiesAiReadModel({
      query,
      opportunities,
      aiSearch,
    });
  }

  private async getOpportunityQualitySnapshots(
    from: Date,
    to: Date,
  ): Promise<readonly OpportunityQualitySnapshot[]> {
    const [linkRows, applyRows, savedRows] = await Promise.all([
      executeRows<{
        opportunity_id: string;
        title: string | null;
        broken_link: boolean | null;
        expired: boolean | null;
        missing_metadata_fields: string[] | null;
        last_checked_at: Date | string | null;
      }>(sql`
        with latest_checks as (
          select distinct on (entity_id)
                 entity_id as opportunity_id,
                 nullif(metadata->>'title', '') as title,
                 (
                   metadata->>'status' in ('broken', 'failed', 'not_found')
                   or metadata->>'ok' = 'false'
                   or metadata->>'brokenLink' = 'true'
                 ) as broken_link,
                 (
                   metadata->>'expired' = 'true'
                   or metadata->>'status' = 'expired'
                 ) as expired,
                 case
                   when jsonb_typeof(metadata->'missingFields') = 'array'
                     then array(select jsonb_array_elements_text(metadata->'missingFields'))
                   when nullif(metadata->>'missingField', '') is not null
                     then array[metadata->>'missingField']
                   else array[]::text[]
                 end as missing_metadata_fields,
                 occurred_at as last_checked_at
          from executive.analytics_events
          where event_type = 'opportunity_link_check'
            and entity_id is not null
            and occurred_at between ${from} and ${to}
          order by entity_id, occurred_at desc
        )
        select * from latest_checks
      `),
      executeRows<{
        opportunity_id: string;
        apply_clicks: string | number;
      }>(sql`
        select entity_id as opportunity_id,
               count(*) as apply_clicks
        from executive.analytics_events
        where event_type = 'opportunity_apply_click'
          and entity_id is not null
          and occurred_at between ${from} and ${to}
        group by entity_id
      `),
      executeRows<{
        opportunity_id: string;
        saved_count: string | number;
      }>(sql`
        select saved.opportunity_id,
               count(*) as saved_count
        from auth.user u
        cross join lateral unnest(coalesce(u.saved_opportunities, '{}'::text[])) as saved(opportunity_id)
        group by saved.opportunity_id
      `),
    ]);

    const snapshots = new Map<string, OpportunityQualitySnapshot>();
    const ensureSnapshot = (opportunityId: string): OpportunityQualitySnapshot => {
      const existing = snapshots.get(opportunityId);
      if (existing) return existing;
      const snapshot: OpportunityQualitySnapshot = {
        opportunityId,
        title: null,
        brokenLink: false,
        expired: false,
        missingMetadataFields: [],
        savedCount: 0,
        applyClicks: 0,
        lastCheckedAt: null,
      };
      snapshots.set(opportunityId, snapshot);
      return snapshot;
    };

    for (const row of linkRows) {
      const snapshot = ensureSnapshot(row.opportunity_id);
      snapshots.set(row.opportunity_id, {
        ...snapshot,
        title: row.title,
        brokenLink: row.broken_link === true,
        expired: row.expired === true,
        missingMetadataFields: row.missing_metadata_fields ?? [],
        lastCheckedAt: row.last_checked_at,
      });
    }

    for (const row of applyRows) {
      const snapshot = ensureSnapshot(row.opportunity_id);
      snapshots.set(row.opportunity_id, {
        ...snapshot,
        applyClicks: numeric(row.apply_clicks),
      });
    }

    for (const row of savedRows) {
      const snapshot = ensureSnapshot(row.opportunity_id);
      snapshots.set(row.opportunity_id, {
        ...snapshot,
        savedCount: numeric(row.saved_count),
      });
    }

    return Array.from(snapshots.values());
  }

  async getTechnicalHealth(
    query: ExecutivePageQuery,
  ): Promise<TechnicalHealthReadModel> {
    const from = toDate(query.from);
    const to = toDateEnd(query.to);
    const [freshness, auditLog, health] = await Promise.all([
      this.getTechnicalFreshness(query.pageSize),
      this.getAdminAuditLog(from, to, query.pageSize),
      this.getTechnicalHealthSnapshot(from, to),
    ]);

    return this.dashboard.buildTechnicalHealthReadModel({
      query,
      freshness,
      auditLog,
      health,
    });
  }

  private async getTechnicalFreshness(
    limit: number,
  ): Promise<TechnicalFreshnessSnapshot[]> {
    const rows = await db
      .select({
        sectionId: dbExecutiveMetricFreshness.sectionId,
        sourceKey: dbExecutiveMetricFreshness.sourceKey,
        status: dbExecutiveMetricFreshness.status,
        lastSuccessfulAt: dbExecutiveMetricFreshness.lastSuccessfulAt,
        lastAttemptedAt: dbExecutiveMetricFreshness.lastAttemptedAt,
        lastErrorCode: dbExecutiveMetricFreshness.lastErrorCode,
        lastQueryDurationMs: dbExecutiveMetricFreshness.lastQueryDurationMs,
        rollingP95DurationMs: dbExecutiveMetricFreshness.rollingP95DurationMs,
      })
      .from(dbExecutiveMetricFreshness)
      .orderBy(desc(dbExecutiveMetricFreshness.updatedAt))
      .limit(limit);

    return rows;
  }

  private async getAdminAuditLog(
    from: Date,
    to: Date,
    limit: number,
  ): Promise<TechnicalAuditSnapshot[]> {
    const rows = await db
      .select({
        id: adminAuditLog.id,
        adminId: adminAuditLog.adminId,
        action: adminAuditLog.action,
        entityType: adminAuditLog.entityType,
        entityId: adminAuditLog.entityId,
        createdAt: adminAuditLog.createdAt,
      })
      .from(adminAuditLog)
      .where(and(gte(adminAuditLog.createdAt, from), lte(adminAuditLog.createdAt, to)))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit);

    return rows;
  }

  private async getTechnicalHealthSnapshot(
    from: Date,
    to: Date,
  ): Promise<TechnicalHealthSnapshot> {
    const [
      progressRows,
      emailQueuedRows,
      emailAcceptedRows,
      emailFailedRows,
      openActionRows,
      sessionRows,
      activeUserRows,
      bannedRows,
      unverifiedRows,
      providerRows,
    ] = await Promise.all([
      db
        .select({ value: count() })
        .from(dbProgressSyncEvents)
        .where(and(gte(dbProgressSyncEvents.createdAt, from), lte(dbProgressSyncEvents.createdAt, to))),
      db
        .select({ value: count() })
        .from(dbEmailDeliveries)
        .where(and(eq(dbEmailDeliveries.status, "queued"), gte(dbEmailDeliveries.createdAt, from), lte(dbEmailDeliveries.createdAt, to))),
      db
        .select({ value: count() })
        .from(dbEmailDeliveries)
        .where(and(eq(dbEmailDeliveries.status, "accepted"), gte(dbEmailDeliveries.createdAt, from), lte(dbEmailDeliveries.createdAt, to))),
      db
        .select({ value: count() })
        .from(dbEmailDeliveries)
        .where(and(eq(dbEmailDeliveries.status, "failed"), gte(dbEmailDeliveries.createdAt, from), lte(dbEmailDeliveries.createdAt, to))),
      db
        .select({ value: count() })
        .from(dbExecutiveActionItemStates)
        .where(inArray(dbExecutiveActionItemStates.status, ["open", "in_progress", "escalated"])),
      db
        .select({ value: count() })
        .from(dbSessions)
        .where(gte(dbSessions.expiresAt, new Date())),
      executeRows<{ value: string | number }>(sql`
        select count(distinct user_id) as value
        from courses.progress_sync_events
        where created_at between ${from} and ${to}
      `),
      db
        .select({ value: count() })
        .from(dbUsers)
        .where(eq(dbUsers.banned, true)),
      db
        .select({ value: count() })
        .from(dbUsers)
        .where(ne(dbUsers.emailVerified, true)),
      db
        .select({
          provider: dbEmailProviderCircuitStates.provider,
          state: dbEmailProviderCircuitStates.state,
          failureCount: dbEmailProviderCircuitStates.failureCount,
          successCount: dbEmailProviderCircuitStates.successCount,
          cooldownUntil: dbEmailProviderCircuitStates.cooldownUntil,
          updatedAt: dbEmailProviderCircuitStates.updatedAt,
        })
        .from(dbEmailProviderCircuitStates),
    ]);

    return {
      progressEvents: numeric(progressRows[0]?.value),
      emailQueued: numeric(emailQueuedRows[0]?.value),
      emailAccepted: numeric(emailAcceptedRows[0]?.value),
      emailFailed: numeric(emailFailedRows[0]?.value),
      openActionItems: numeric(openActionRows[0]?.value),
      activeSessions: numeric(sessionRows[0]?.value),
      activeUsers: numeric(activeUserRows[0]?.value),
      bannedUsers: numeric(bannedRows[0]?.value),
      unverifiedUsers: numeric(unverifiedRows[0]?.value),
      emailProviders: providerRows.map((row) => ({
        provider: row.provider,
        state: row.state,
        failureCount: row.failureCount,
        successCount: row.successCount,
        cooldownUntil: row.cooldownUntil,
        updatedAt: row.updatedAt,
      })),
    };
  }

  async getPublicGrowth(query: ExecutivePageQuery): Promise<PublicGrowthReadModel> {
    const from = toDate(query.from);
    const to = toDateEnd(query.to);
    const [current, websiteAnalytics, retention, publicImpactMetrics] = await Promise.all([
      this.getGrowthFunnelSnapshot(from, to),
      getWebsiteAnalyticsSnapshot(from, to),
      this.getGrowthCohortRetention(from, to),
      this.getPublicImpactMetricRows(),
    ]);

    return this.dashboard.buildPublicGrowthReadModel({
      query,
      current,
      websiteAnalytics,
      cohortRetention: retention,
      publicImpactMetrics,
    });
  }

  private async getGrowthFunnelSnapshot(
    from: Date,
    to: Date,
  ): Promise<GrowthFunnelSnapshot> {
    const [
      eventRows,
      signupRows,
      enrollmentRows,
      completionRows,
    ] = await Promise.all([
      db
        .select({
          eventType: dbExecutiveAnalyticsEvents.eventType,
          value: count(),
        })
        .from(dbExecutiveAnalyticsEvents)
        .where(
          and(
            gte(dbExecutiveAnalyticsEvents.occurredAt, from),
            lte(dbExecutiveAnalyticsEvents.occurredAt, to),
            inArray(dbExecutiveAnalyticsEvents.eventType, [
              "website_visit",
              "signup_started",
              "opportunity_apply_click",
            ]),
          ),
        )
        .groupBy(dbExecutiveAnalyticsEvents.eventType),
      db
        .select({ value: count() })
        .from(dbUsers)
        .where(and(gte(dbUsers.createdAt, from), lte(dbUsers.createdAt, to))),
      db
        .select({ value: count() })
        .from(dbSubscriptions)
        .where(and(gte(dbSubscriptions.enrolledAt, from), lte(dbSubscriptions.enrolledAt, to))),
      db
        .select({ value: count() })
        .from(dbCourseProgress)
        .where(
          and(
            eq(dbCourseProgress.status, "completed"),
            gte(dbCourseProgress.completedAt, from),
            lte(dbCourseProgress.completedAt, to),
          ),
        ),
    ]);
    const eventCounts = new Map(
      eventRows.map((row) => [row.eventType, numeric(row.value)]),
    );

    return {
      websiteVisits: eventCounts.has("website_visit")
        ? eventCounts.get("website_visit") ?? 0
        : null,
      signupStarts: eventCounts.has("signup_started")
        ? eventCounts.get("signup_started") ?? 0
        : null,
      signups: numeric(signupRows[0]?.value),
      enrollments: numeric(enrollmentRows[0]?.value),
      completions: numeric(completionRows[0]?.value),
      opportunityActions: eventCounts.has("opportunity_apply_click")
        ? eventCounts.get("opportunity_apply_click") ?? 0
        : null,
    };
  }

  private async getGrowthCohortRetention(
    from: Date,
    to: Date,
  ): Promise<readonly { cohort: string; users: number; retainedUsers: number; retentionRate: number | null }[]> {
    const rows = await executeRows<{
      cohort: string;
      users: string | number;
      retained_users: string | number;
    }>(sql`
      with cohorts as (
        select date_trunc('month', u.created_at)::date as cohort,
               u.id as user_id
        from auth.user u
        where u.created_at between ${from} and ${to}
      )
      select to_char(cohort, 'YYYY-MM') as cohort,
             count(distinct user_id) as users,
             count(distinct pse.user_id) as retained_users
      from cohorts
      left join courses.progress_sync_events pse
        on pse.user_id = cohorts.user_id
       and pse.created_at >= cohorts.cohort
       and pse.created_at < cohorts.cohort + interval '30 days'
      group by cohort
      order by cohort asc
    `);

    return rows.map((row) => {
      const users = numeric(row.users);
      const retainedUsers = numeric(row.retained_users);
      return {
        cohort: row.cohort,
        users,
        retainedUsers,
        retentionRate: users > 0 ? retainedUsers / users : null,
      };
    });
  }

  private async getPublicImpactMetricRows(): Promise<
    readonly Omit<PublicImpactMetricGovernanceRow, "state">[]
  > {
    return listPublicImpactMetricRows();
  }

  async getTeamOperations(
    query: ExecutivePageQuery,
  ): Promise<TeamOperationsReadModel> {
    const from = toDate(query.from);
    const to = toDateEnd(query.to);
    const inquiries = await this.getInquiryPipeline(from, to, query.inquiryStatus);
    return this.dashboard.buildTeamOperationsReadModel({
      query,
      inquiries,
    });
  }

  private async getInquiryPipeline(
    from: Date,
    to: Date,
    status?: string,
  ): Promise<readonly InquiryPipelineSnapshot[]> {
    const rows = await db
      .select({
        inquiryId: dbInquiries.id,
        courseId: dbInquiries.courseId,
        courseTitle: dbCourses.title,
        status: dbInquiries.status,
        sourceChannel: dbInquiries.sourceSurface,
        submittedAt: dbInquiries.createdAt,
        updatedAt: dbInquiries.updatedAt,
      })
      .from(dbInquiries)
      .innerJoin(dbCourses, eq(dbCourses.id, dbInquiries.courseId))
      .where(
        and(
          gte(dbInquiries.createdAt, from),
          lte(dbInquiries.createdAt, to),
          status ? eq(dbInquiries.status, status) : undefined,
        ),
      )
      .orderBy(desc(dbInquiries.createdAt))
      .limit(500);

    return rows.map((row) => ({
      inquiryId: row.inquiryId,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      status: row.status,
      assignedOwnerId: null,
      sourceChannel: row.sourceChannel,
      submittedAt: row.submittedAt ?? new Date(0),
      updatedAt: row.updatedAt,
    }));
  }

  async getFinance(query: ExecutivePageQuery): Promise<FinanceReadModel> {
    return emptyPageResponse("finance", query);
  }
}

export function createExecutiveReadRepository(): ExecutiveReadRepository {
  return new DrizzleExecutiveReadRepository();
}

type PublicImpactMetricRow = typeof dbExecutivePublicImpactMetrics.$inferSelect;

function toPublicImpactDraft(row: PublicImpactMetricRow): PublicImpactMetricDraft {
  return {
    metricId: row.metricId,
    label: row.label,
    computedValue: row.computedValue,
    manualOverrideValue: row.manualOverrideValue,
    sourceDescription: row.sourceDescription,
    ownerId: row.ownerId,
    approvalStatus: row.approvalStatus,
    proposedBy: row.proposedBy,
    approvedBy: row.approvedBy,
    approvedAt: row.approvedAt,
    rejectedBy: row.rejectedBy,
    rejectedAt: row.rejectedAt,
    rejectionReason: row.rejectionReason,
    auditTrail: normalizeAuditTrail(row.auditTrail),
    autoPublish: row.autoPublish,
    freshnessAt: row.freshnessAt,
    updatedAt: row.updatedAt,
  };
}

function toPublicImpactGovernanceRow(
  row: PublicImpactMetricRow,
): Omit<PublicImpactMetricGovernanceRow, "state"> {
  return {
    ...toPublicImpactDraft(row),
    value: row.manualOverrideValue ?? row.computedValue,
    approvedAt: toIso(row.approvedAt),
    rejectedAt: toIso(row.rejectedAt),
    freshnessAt: row.freshnessAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function listPublicImpactMetricRows(): Promise<
  readonly Omit<PublicImpactMetricGovernanceRow, "state">[]
> {
  const rows = await db
    .select()
    .from(dbExecutivePublicImpactMetrics)
    .orderBy(desc(dbExecutivePublicImpactMetrics.updatedAt))
    .limit(100);

  return rows.map(toPublicImpactGovernanceRow);
}

export class DrizzlePublicImpactGovernanceRepository
  implements PublicImpactGovernanceRepository {
  async listMetrics(): Promise<readonly PublicImpactMetricGovernanceRow[]> {
    const defaultState = {
      status: "ready",
      freshness: "current",
      lastSuccessfulAt: new Date().toISOString(),
    } as const;
    return (await listPublicImpactMetricRows()).map((row) => ({
      ...row,
      state: defaultState,
    }));
  }

  async findMetric(metricId: string): Promise<PublicImpactMetricDraft | null> {
    const rows = await db
      .select()
      .from(dbExecutivePublicImpactMetrics)
      .where(eq(dbExecutivePublicImpactMetrics.metricId, metricId))
      .limit(1);
    return rows[0] ? toPublicImpactDraft(rows[0]) : null;
  }

  async upsertProposal(
    input: PublicImpactMetricDraft,
  ): Promise<PublicImpactMetricGovernanceRow> {
    const rows = await db
      .insert(dbExecutivePublicImpactMetrics)
      .values({
        metricId: input.metricId,
        label: input.label,
        computedValue: input.computedValue,
        manualOverrideValue: input.manualOverrideValue,
        sourceDescription: input.sourceDescription,
        ownerId: input.ownerId,
        approvalStatus: input.approvalStatus,
        proposedBy: input.proposedBy,
        approvedBy: input.approvedBy,
        approvedAt: input.approvedAt ? new Date(input.approvedAt) : null,
        rejectedBy: input.rejectedBy,
        rejectedAt: input.rejectedAt ? new Date(input.rejectedAt) : null,
        rejectionReason: input.rejectionReason,
        auditTrail: input.auditTrail,
        autoPublish: input.autoPublish,
        freshnessAt: new Date(input.freshnessAt),
        updatedAt: new Date(input.updatedAt),
      })
      .onConflictDoUpdate({
        target: dbExecutivePublicImpactMetrics.metricId,
        set: {
          label: input.label,
          computedValue: input.computedValue,
          manualOverrideValue: input.manualOverrideValue,
          sourceDescription: input.sourceDescription,
          ownerId: input.ownerId,
          approvalStatus: input.approvalStatus,
          proposedBy: input.proposedBy,
          approvedBy: input.approvedBy,
          approvedAt: input.approvedAt ? new Date(input.approvedAt) : null,
          rejectedBy: input.rejectedBy,
          rejectedAt: input.rejectedAt ? new Date(input.rejectedAt) : null,
          rejectionReason: input.rejectionReason,
          auditTrail: input.auditTrail,
          autoPublish: input.autoPublish,
          freshnessAt: new Date(input.freshnessAt),
          updatedAt: new Date(input.updatedAt),
        },
      })
      .returning();
    return {
      ...toPublicImpactGovernanceRow(rows[0]),
      state: {
        status: "ready",
        freshness: "current",
        lastSuccessfulAt: new Date().toISOString(),
      },
    };
  }

  async updateReview(
    metricId: string,
    input: Partial<PublicImpactMetricDraft>,
  ): Promise<PublicImpactMetricGovernanceRow | null> {
    const rows = await db
      .update(dbExecutivePublicImpactMetrics)
      .set({
        ...(input.approvalStatus !== undefined && { approvalStatus: input.approvalStatus }),
        ...(input.approvedBy !== undefined && { approvedBy: input.approvedBy }),
        ...(input.approvedAt !== undefined && {
          approvedAt: input.approvedAt ? new Date(input.approvedAt) : null,
        }),
        ...(input.rejectedBy !== undefined && { rejectedBy: input.rejectedBy }),
        ...(input.rejectedAt !== undefined && {
          rejectedAt: input.rejectedAt ? new Date(input.rejectedAt) : null,
        }),
        ...(input.rejectionReason !== undefined && { rejectionReason: input.rejectionReason }),
        ...(input.auditTrail !== undefined && { auditTrail: input.auditTrail }),
        ...(input.updatedAt !== undefined && { updatedAt: new Date(input.updatedAt) }),
      })
      .where(eq(dbExecutivePublicImpactMetrics.metricId, metricId))
      .returning();
    if (!rows[0]) return null;
    return {
      ...toPublicImpactGovernanceRow(rows[0]),
      state: {
        status: "ready",
        freshness: "current",
        lastSuccessfulAt: new Date().toISOString(),
      },
    };
  }
}

export function createPublicImpactGovernanceRepository(): PublicImpactGovernanceRepository {
  return new DrizzlePublicImpactGovernanceRepository();
}
