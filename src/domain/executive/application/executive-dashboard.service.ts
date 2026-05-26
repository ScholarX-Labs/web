import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";
import type {
  ExecutiveMetricValue,
  AiQualitySignal,
  AiSearchTrendPoint,
  AiUsageRow,
  ExecutivePageResponse,
  OverviewFunnelPoint,
  OverviewReadModel,
  OverviewRiskIndicator,
  OverviewSections,
  OverviewTrendPoint,
  UsersActivityHeatmapPoint,
  UsersMonthlyActivityPoint,
  UsersPeakActivity,
  UsersReadModel,
  UsersRoleDistributionPoint,
  UsersSections,
  UsersTrendPoint,
  TechnicalAuditRow,
  TechnicalEmailHealth,
  TechnicalFreshnessRow,
  TechnicalHealthReadModel,
  TechnicalHealthSections,
  TechnicalPipelineHealth,
  TechnicalPlatformUsage,
  TechnicalQueryLatencyPoint,
  TechnicalSecuritySignals,
  CourseCategoryDistributionPoint,
  CourseLeaderboardRow,
  CourseManagementLink,
  CoursesLessonsReadModel,
  CoursesLessonsSections,
  CriticalDropFlag,
  LessonAnalyticsRow,
  LessonCompletionFunnelPoint,
  LessonDrilldownReadModel,
  LessonDrilldownSections,
  ProblemCourseSignal,
  FinanceCoursePerformanceRow,
  FinanceReadModel,
  FinanceSections,
  FinanceSummary,
  GrowthCohortRetentionPoint,
  GrowthFunnelPoint,
  OpportunitiesAiReadModel,
  OpportunitiesAiSections,
  OpportunityQualityIssueType,
  OpportunityQualityQueueRow,
  PublicGrowthReadModel,
  PublicGrowthSections,
  PublicImpactAuditEntry,
  PublicImpactMetricGovernanceRow,
  RegisteredEventRow,
  RegisteredEventsSummary,
  WebsiteAnalyticsPoint,
  WebsiteCtaPoint,
  TeamOperationsReadModel,
  TeamOperationsSections,
} from "../contracts/executive-read-repository.contract";
import type { ExecutiveSectionState } from "../contracts/executive-types";
import { MetricCalculationPolicy } from "./metric-calculation.policy";
import { ChartSeriesMapper } from "./chart-series.mapper";
import { FreshnessService } from "./freshness.service";

type FinanceCourseSortKey =
  | "title"
  | "category"
  | "grossRevenue"
  | "refundedRevenue"
  | "netRevenue"
  | "enrollments"
  | "completions"
  | "completionRate"
  | "refundRate"
  | "supportInquiryCount"
  | "profitabilityProxy";

export type OverviewAggregateSnapshot = {
  grossRevenue: number;
  subscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  users: number;
  courseCompletions: number;
  activeCourses: number;
};

export type OverviewTrendSnapshot = {
  date: string;
  revenue: number;
  completions: number;
};

export type UsersAggregateSnapshot = {
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  bannedUsers: number;
};

export type UsersTrendSnapshot = {
  date: string;
  newUsers: number;
};

export type UsersRoleSnapshot = {
  role: string | null;
  value: number;
};

export type UsersActivityEventSnapshot = {
  occurredAt: Date | string;
};

export type UsersMonthlyActivitySnapshot = {
  month: string;
  value: number;
};

export type UsersManagementSnapshot = {
  userId: string;
  email: string | null;
  name: string | null;
  role: string | null;
  createdAt: Date | string;
  isEmailVerified: boolean;
  isBanned: boolean;
};

export type TechnicalFreshnessSnapshot = {
  sectionId: string;
  sourceKey: string;
  status: "current" | "stale" | "very_stale" | "unavailable";
  lastSuccessfulAt: Date | string | null;
  lastAttemptedAt: Date | string;
  lastErrorCode: string | null;
  lastQueryDurationMs: number | null;
  rollingP95DurationMs: number | null;
};

export type TechnicalAuditSnapshot = {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date | string;
};

export type TechnicalHealthSnapshot = {
  progressEvents: number;
  emailQueued: number;
  emailAccepted: number;
  emailFailed: number;
  openActionItems: number;
  activeSessions: number;
  activeUsers: number;
  bannedUsers: number;
  unverifiedUsers: number;
  emailProviders: readonly {
    provider: string;
    state: string;
    failureCount: number;
    successCount: number;
    cooldownUntil: Date | string | null;
    updatedAt: Date | string;
  }[];
};

export type CoursesLessonsAggregateSnapshot = {
  totalCourses: number;
  activeCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  totalCompletions: number;
};

export type CoursesManagementSnapshot = {
  courseId: string;
  title: string;
  category: string;
  status: string;
  ownerId: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  lessons: number;
  enrollments: number;
  completions: number;
};

export type CourseQualitySnapshot = {
  courseId: string;
  hasThumbnail: boolean;
  ownerId: string | null;
  updatedAt: Date | string | null;
  lessonCount: number;
  draftLessonCount: number;
  staleLessonCount: number;
  brokenMediaCount: number;
};

export type LessonQualitySnapshot = {
  lessonId: string;
  title: string;
  status: string;
  videoUrl: string | null;
  updatedAt: Date | string;
  isArchived: boolean;
};

export type BuildCoursesLessonsReadModelInput = {
  query: ExecutivePageQuery;
  current: CoursesLessonsAggregateSnapshot;
  previous: CoursesLessonsAggregateSnapshot;
  leaderboard: readonly CourseLeaderboardRow[];
  categoryDistribution: readonly { category: string; value: number }[];
  contentQualityRows?: readonly CourseQualitySnapshot[];
  managementRows?: readonly CoursesManagementSnapshot[];
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
};

export type BuildLessonDrilldownReadModelInput = {
  query: ExecutivePageQuery;
  courseId: string;
  lessons: readonly Omit<LessonAnalyticsRow, "completionRate" | "state">[];
  contentQualityLessons?: readonly LessonQualitySnapshot[];
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
};

export type FinanceCourseSnapshot = {
  courseId: string;
  title: string;
  category: string;
  grossRevenue: number;
  refundedRevenue: number;
  enrollments: number;
  completions: number;
  supportInquiryCount: number;
};

export type FinanceAggregateSnapshot = {
  grossRevenue: number;
  refundedRevenue: number;
  enrollments: number;
  paidEnrollments: number;
  manualEnrollments: number;
  activeLearners: number;
  completions: number;
  supportInquiries: number;
};

export type BuildFinanceReadModelInput = {
  query: ExecutivePageQuery;
  current: FinanceAggregateSnapshot;
  previous: FinanceAggregateSnapshot;
  courses: readonly FinanceCourseSnapshot[];
  selectedCourse?: FinanceCourseSnapshot | null;
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
};

export type GrowthFunnelSnapshot = {
  websiteVisits: number | null;
  signupStarts: number | null;
  signups: number;
  enrollments: number;
  completions: number;
  opportunityActions: number | null;
};

export type BuildPublicGrowthReadModelInput = {
  query: ExecutivePageQuery;
  current: GrowthFunnelSnapshot;
  websiteAnalytics?: WebsiteAnalyticsSnapshot;
  cohortRetention?: readonly GrowthCohortRetentionPoint[];
  publicImpactMetrics?: readonly {
    metricId: string;
    label: string;
    value: number;
    status?: string;
    computedValue?: number;
    manualOverrideValue?: number | null;
    sourceDescription?: string;
    ownerId?: string;
    approvalStatus?: PublicImpactMetricGovernanceRow["approvalStatus"];
    proposedBy?: string | null;
    approvedBy?: string | null;
    approvedAt?: Date | string | null;
    rejectedBy?: string | null;
    rejectedAt?: Date | string | null;
    rejectionReason?: string | null;
    auditTrail?: readonly PublicImpactAuditEntry[];
    autoPublish?: boolean;
    freshnessAt?: Date | string;
    updatedAt?: Date | string;
  }[];
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
};

export type WebsiteAnalyticsSnapshot = {
  trafficSources: readonly { label: string; visits: number }[];
  deviceBreakdown: readonly { label: string; visits: number }[];
  campaignPerformance: readonly { label: string; visits: number }[];
  ctaPerformance: readonly { ctaId: string; label: string; clicks: number }[];
  ctaClicks: number | null;
};

export type OpportunityQualitySnapshot = {
  opportunityId: string;
  title: string | null;
  brokenLink: boolean;
  expired: boolean;
  missingMetadataFields: readonly string[];
  savedCount: number;
  applyClicks: number;
  lastCheckedAt: Date | string | null;
};

export type RegisteredEventSnapshot = {
  eventId: string;
  title: string;
  registrations: number;
  attendanceTracked: boolean;
  /** Actual attendee count. Only meaningful when attendanceTracked is true. */
  attendees: number | null;
  /** Users who signed up after attending. null when not tracked. */
  postEventSignups: number | null;
  /** Users who enrolled in a course after attending. null when not tracked. */
  postEventEnrollments: number | null;
};

export type BuildOpportunitiesAiReadModelInput = {
  query: ExecutivePageQuery;
  opportunities: readonly OpportunityQualitySnapshot[];
  aiSearch?: AiSearchAnalyticsSnapshot;
  /** Pass undefined to indicate event data is unavailable (renders data_gap). */
  registeredEvents?: readonly RegisteredEventSnapshot[];
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
};

export type AiSearchAnalyticsSnapshot = {
  totalSearches: number | null;
  zeroResultSearches: number | null;
  errorSearches: number | null;
  feedbackCount: number | null;
  estimatedCost: number | null;
  averageLatencyMs: number | null;
  trend: readonly AiSearchTrendPoint[];
  usageByUser: readonly Omit<AiUsageRow, "state">[];
};

export type InquiryPipelineSnapshot = {
  inquiryId: string;
  courseId: string;
  courseTitle: string;
  status: string;
  assignedOwnerId: string | null;
  sourceChannel: string | null;
  submittedAt: Date | string;
  updatedAt: Date | string | null;
};

export type BuildTeamOperationsReadModelInput = {
  query: ExecutivePageQuery;
  inquiries: readonly InquiryPipelineSnapshot[];
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
  slaHours?: number;
};

export type BuildOverviewReadModelInput = {
  query: ExecutivePageQuery;
  current: OverviewAggregateSnapshot;
  previous: OverviewAggregateSnapshot;
  trends: readonly OverviewTrendSnapshot[];
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
};

export type BuildUsersReadModelInput = {
  query: ExecutivePageQuery;
  current: UsersAggregateSnapshot;
  previous: UsersAggregateSnapshot;
  registrationTrend: readonly UsersTrendSnapshot[];
  roleDistribution: readonly UsersRoleSnapshot[];
  activityEvents: readonly UsersActivityEventSnapshot[];
  monthlyActivity?: readonly UsersMonthlyActivitySnapshot[];
  managementRows?: readonly UsersManagementSnapshot[];
  generatedAt?: Date;
  sectionState?: ExecutiveSectionState;
};

export type BuildTechnicalHealthReadModelInput = {
  query: ExecutivePageQuery;
  freshness: readonly TechnicalFreshnessSnapshot[];
  auditLog: readonly TechnicalAuditSnapshot[];
  health: TechnicalHealthSnapshot;
  generatedAt?: Date;
};

const defaultReadyState = (generatedAt: Date): ExecutiveSectionState => ({
  status: "ready",
  freshness: "current",
  lastSuccessfulAt: generatedAt.toISOString(),
});

function metric(
  definitionId: string,
  value: number,
  previousValue: number,
  state: ExecutiveSectionState,
  calculations: MetricCalculationPolicy,
): ExecutiveMetricValue {
  const delta = calculations.calculateDelta(value, previousValue);
  return {
    definitionId,
    value,
    previousValue,
    deltaValue: delta.deltaValue,
    deltaPercent: delta.deltaPercent,
    state,
  };
}

function buildRiskIndicators(input: {
  current: OverviewAggregateSnapshot;
  completionRate: number | null;
  state: ExecutiveSectionState;
}): OverviewRiskIndicator[] {
  const indicators: OverviewRiskIndicator[] = [];

  if (input.current.grossRevenue <= 0) {
    indicators.push({
      id: "overview.no_revenue",
      label: "Revenue activity",
      severity: "high",
      value: input.current.grossRevenue,
      message: "No subscription revenue was recorded in the selected period.",
      state: input.state,
    });
  }

  if (input.completionRate !== null && input.completionRate < 0.25) {
    indicators.push({
      id: "overview.low_completion_rate",
      label: "Completion rate",
      severity: "medium",
      value: input.completionRate,
      message: "Course completions are below the healthy operating threshold.",
      state: input.state,
    });
  }

  if (input.current.cancelledSubscriptions > input.current.activeSubscriptions) {
    indicators.push({
      id: "overview.subscription_churn",
      label: "Subscription churn",
      severity: "high",
      value: input.current.cancelledSubscriptions,
      message: "Cancelled subscriptions exceed active subscriptions for this range.",
      state: input.state,
    });
  }

  return indicators;
}

function normalizeRole(role: string | null): string {
  return role?.trim() || "learner";
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function funnelPoint(input: {
  id: string;
  label: string;
  value: number | null;
  previousValue: number | null;
  state: ExecutiveSectionState;
  calculations: MetricCalculationPolicy;
}): GrowthFunnelPoint {
  const rate = input.previousValue === null
    ? null
    : input.calculations.calculateRate(input.value ?? 0, input.previousValue);
  return {
    id: input.id,
    label: input.label,
    value: input.value,
    rate,
    dropOffFromPrevious: rate === null ? null : 1 - rate,
    state: input.value === null ? { ...input.state, status: "data_gap", freshness: "unavailable" } : input.state,
  };
}

function distributionPoints(
  rows: readonly { label: string; visits: number }[],
  denominator: number | null,
  calculations: MetricCalculationPolicy,
): WebsiteAnalyticsPoint[] {
  return rows.map((row) => ({
    label: row.label,
    value: row.visits,
    rate: denominator === null ? null : calculations.calculateRate(row.visits, denominator),
  }));
}

const highSaveThreshold = 10;
const lowApplyRateThreshold = 0.1;
const defaultInquirySlaHours = 48;
const lowCompletionThreshold = 0.25;
const highEnrollmentThreshold = 15;
const staleLessonDays = 30;
const highRefundThreshold = 0.2;

function dayDifference(later: Date, earlier: Date): number {
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 86_400_000));
}

function courseQualityFlags(input: {
  course: CourseLeaderboardRow;
  quality?: CourseQualitySnapshot;
}): readonly string[] {
  const flags = new Set<string>();
  const quality = input.quality;
  if (quality && !quality.hasThumbnail) flags.add("missing_thumbnail");
  if (quality && !quality.ownerId) flags.add("no_owner");
  if (input.course.enrollments >= highEnrollmentThreshold && (input.course.completionRate ?? 0) < lowCompletionThreshold) {
    flags.add("problem_course");
  }
  if (quality && quality.draftLessonCount > 0) flags.add("draft_lessons");
  if (quality && quality.staleLessonCount > 0) flags.add("stale_lessons");
  if (quality && quality.brokenMediaCount > 0) flags.add("broken_media");
  return Array.from(flags);
}

function lessonQualityFlags(input: {
  lesson: LessonQualitySnapshot;
  dropOff: CriticalDropFlag | null;
  now: Date;
}): readonly string[] {
  const flags = new Set<string>();
  if (!input.lesson.videoUrl) flags.add("missing_video");
  if (input.lesson.status === "draft") flags.add("draft");
  if (dayDifference(input.now, toDate(input.lesson.updatedAt)) >= staleLessonDays) {
    flags.add("stale");
  }
  if (input.dropOff) flags.add("critical_drop");
  return Array.from(flags);
}
function opportunityIssue(input: {
  opportunity: OpportunityQualitySnapshot;
  issueType: OpportunityQualityIssueType;
  severity: OpportunityQualityQueueRow["severity"];
  recommendedAction: string;
  state: ExecutiveSectionState;
  calculations: MetricCalculationPolicy;
}): OpportunityQualityQueueRow {
  const title = input.opportunity.title?.trim() || `Opportunity ${input.opportunity.opportunityId}`;
  return {
    id: `${input.opportunity.opportunityId}:${input.issueType}`,
    opportunityId: input.opportunity.opportunityId,
    title,
    issueType: input.issueType,
    severity: input.severity,
    savedCount: input.opportunity.savedCount,
    applyClicks: input.opportunity.applyClicks,
    applyRate: input.calculations.calculateRate(
      input.opportunity.applyClicks,
      input.opportunity.savedCount,
    ),
    missingFields: input.opportunity.missingMetadataFields,
    lastCheckedAt: input.opportunity.lastCheckedAt
      ? toDate(input.opportunity.lastCheckedAt).toISOString()
      : null,
    recommendedAction: input.recommendedAction,
    state: input.state,
  };
}

function hoursBetween(later: Date, earlier: Date): number {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 3_600_000));
}

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  return value ? toDate(value).toISOString() : null;
}

export class ExecutiveDashboardService {
  private readonly financeSortKeys = new Set([
    "title",
    "category",
    "grossRevenue",
    "refundedRevenue",
    "netRevenue",
    "enrollments",
    "completions",
    "completionRate",
    "refundRate",
    "supportInquiryCount",
    "profitabilityProxy",
  ] as const);

  private normalizeFinanceSort(sort: string | undefined): FinanceCourseSortKey {
    if (sort && this.financeSortKeys.has(sort as FinanceCourseSortKey)) {
      return sort as FinanceCourseSortKey;
    }
    return "profitabilityProxy";
  }

  constructor(
    private readonly calculations = new MetricCalculationPolicy(),
    private readonly charts = new ChartSeriesMapper(),
    private readonly freshnessService = new FreshnessService(),
  ) {}

  private sortFinancePerformanceRows(
    rows: readonly FinanceCoursePerformanceRow[],
    sort: FinanceCourseSortKey,
    direction: "asc" | "desc",
  ): FinanceCoursePerformanceRow[] {
    if (sort === "profitabilityProxy") {
      return [...rows].sort((left, right) =>
        right.profitabilityProxy - left.profitabilityProxy
        || right.grossRevenue - left.grossRevenue);
    }

    const compare = (left: FinanceCoursePerformanceRow, right: FinanceCoursePerformanceRow): number => {
      const byField = (() => {
        switch (sort) {
          case "title":
            return left.title.localeCompare(right.title);
          case "category":
            return left.category.localeCompare(right.category);
          case "grossRevenue":
            return left.grossRevenue - right.grossRevenue;
          case "refundedRevenue":
            return left.refundedRevenue - right.refundedRevenue;
          case "netRevenue":
            return left.netRevenue - right.netRevenue;
          case "enrollments":
            return left.enrollments - right.enrollments;
          case "completions":
            return left.completions - right.completions;
          case "completionRate":
            return (left.completionRate ?? -1) - (right.completionRate ?? -1);
          case "refundRate":
            return (left.refundRate ?? -1) - (right.refundRate ?? -1);
          case "supportInquiryCount":
            return left.supportInquiryCount - right.supportInquiryCount;
        }
      })();

      if (byField !== 0) return byField;
      return left.courseId.localeCompare(right.courseId);
    };

    const factor = direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => compare(left, right) * factor);
  }

  buildOverviewReadModel({
    query,
    current,
    previous,
    trends,
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
  }: BuildOverviewReadModelInput): OverviewReadModel {
    const completionRate =
      this.calculations.calculateRate(current.courseCompletions, current.subscriptions) ??
      null;
    const previousCompletionRate =
      this.calculations.calculateRate(
        previous.courseCompletions,
        previous.subscriptions,
      ) ?? null;

    const kpis = [
      metric(
        "overview.gross_revenue",
        current.grossRevenue,
        previous.grossRevenue,
        sectionState,
        this.calculations,
      ),
      metric(
        "overview.net_new_subscriptions",
        current.subscriptions - current.cancelledSubscriptions,
        previous.subscriptions - previous.cancelledSubscriptions,
        sectionState,
        this.calculations,
      ),
      metric(
        "overview.active_courses",
        current.activeCourses,
        previous.activeCourses,
        sectionState,
        this.calculations,
      ),
      {
        definitionId: "overview.completion_rate",
        value: completionRate,
        previousValue: previousCompletionRate,
        ...this.calculations.calculateDelta(completionRate, previousCompletionRate),
        state: sectionState,
      },
    ] satisfies readonly ExecutiveMetricValue[];

    const revenuePoints: OverviewTrendPoint[] = trends.map((point) => ({
      date: point.date,
      value: point.revenue,
    }));
    const completionPoints: OverviewTrendPoint[] = trends.map((point) => ({
      date: point.date,
      value: point.completions,
    }));
    const funnelPoints: OverviewFunnelPoint[] = [
      {
        label: "New subscriptions",
        value: current.subscriptions,
        rate: null,
      },
      {
        label: "Active subscriptions",
        value: current.activeSubscriptions,
        rate: this.calculations.calculateRate(
          current.activeSubscriptions,
          current.subscriptions,
        ),
      },
      {
        label: "Course completions",
        value: current.courseCompletions,
        rate: completionRate,
      },
    ];

    const sections: OverviewSections = {
      kpis,
      revenueTrend: this.charts.toChart({
        id: "overview.revenue_trend",
        title: "Revenue trend",
        chartType: "area",
        points: revenuePoints,
        a11ySummary: `Revenue totaled ${current.grossRevenue} across ${revenuePoints.length} periods.`,
        state: sectionState,
      }),
      completionTrend: this.charts.toChart({
        id: "overview.completion_trend",
        title: "Completion trend",
        chartType: "area",
        points: completionPoints,
        a11ySummary: `${current.courseCompletions} course completions were recorded in the selected range.`,
        state: sectionState,
      }),
      subscriptionFunnel: this.charts.toChart({
        id: "overview.subscription_funnel",
        title: "Subscription funnel",
        chartType: "funnel",
        points: funnelPoints,
        a11ySummary: `${current.activeSubscriptions} of ${current.subscriptions} subscriptions remain active.`,
        state: sectionState,
      }),
      riskIndicators: buildRiskIndicators({
        current,
        completionRate,
        state: sectionState,
      }),
    };

    return {
      pageId: "overview",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: {
        current: 4,
        stale: 0,
        very_stale: 0,
        unavailable: 0,
      },
      redactionNotes: [],
    } satisfies ExecutivePageResponse<OverviewSections>;
  }

  bucketActivityHeatmap(
    events: readonly UsersActivityEventSnapshot[],
  ): UsersActivityHeatmapPoint[] {
    const buckets = new Map<string, UsersActivityHeatmapPoint>();
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
      for (let hour = 0; hour < 24; hour += 1) {
        buckets.set(`${dayOfWeek}:${hour}`, { dayOfWeek, hour, value: 0 });
      }
    }

    for (const event of events) {
      const occurredAt = toDate(event.occurredAt);
      const key = `${occurredAt.getUTCDay()}:${occurredAt.getUTCHours()}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.value += 1;
    }

    return Array.from(buckets.values());
  }

  findPeakActivity(input: {
    heatmap: readonly UsersActivityHeatmapPoint[];
    monthlyActivity: readonly UsersMonthlyActivityPoint[];
    state: ExecutiveSectionState;
  }): UsersPeakActivity {
    const peakBucket = input.heatmap.reduce<UsersActivityHeatmapPoint | null>(
      (current, bucket) => (!current || bucket.value > current.value ? bucket : current),
      null,
    );
    const peakMonth = input.monthlyActivity.reduce<UsersMonthlyActivityPoint | null>(
      (current, point) => (!current || point.value > current.value ? point : current),
      null,
    );

    return {
      peakDayOfWeek:
        peakBucket && peakBucket.value > 0 ? peakBucket.dayOfWeek : null,
      peakHour: peakBucket && peakBucket.value > 0 ? peakBucket.hour : null,
      peakMonth: peakMonth && peakMonth.value > 0 ? peakMonth.month : null,
      eventCount: peakBucket?.value ?? 0,
      state: input.state,
    };
  }

  buildUsersReadModel({
    query,
    current,
    previous,
    registrationTrend,
    roleDistribution,
    activityEvents,
    monthlyActivity,
    managementRows = [],
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
  }: BuildUsersReadModelInput): UsersReadModel {
    const verifiedRate =
      this.calculations.calculateRate(current.verifiedUsers, current.totalUsers) ??
      null;
    const previousVerifiedRate =
      this.calculations.calculateRate(previous.verifiedUsers, previous.totalUsers) ??
      null;
    const totalRoles = roleDistribution.reduce((sum, role) => sum + role.value, 0);
    const rolePoints: UsersRoleDistributionPoint[] = roleDistribution.map((role) => ({
      role: normalizeRole(role.role),
      value: role.value,
      rate: this.calculations.calculateRate(role.value, totalRoles),
    }));
    const growthPoints: UsersTrendPoint[] = registrationTrend.map((point) => ({
      date: point.date,
      value: point.newUsers,
    }));
    const heatmap = this.bucketActivityHeatmap(activityEvents);
    const monthlyPoints: UsersMonthlyActivityPoint[] =
      monthlyActivity?.map((point) => ({ month: point.month, value: point.value })) ??
      Array.from(
        activityEvents.reduce((counts, event) => {
          const key = monthKey(toDate(event.occurredAt));
          counts.set(key, (counts.get(key) ?? 0) + 1);
          return counts;
        }, new Map<string, number>()),
        ([month, value]) => ({ month, value }),
      ).sort((a, b) => a.month.localeCompare(b.month));

    const sections: UsersSections = {
      kpis: [
        metric(
          "users.new_users",
          current.newUsers,
          previous.newUsers,
          sectionState,
          this.calculations,
        ),
        metric(
          "users.active_users",
          current.activeUsers,
          previous.activeUsers,
          sectionState,
          this.calculations,
        ),
        {
          definitionId: "users.verified_email_rate",
          value: verifiedRate,
          previousValue: previousVerifiedRate,
          ...this.calculations.calculateDelta(verifiedRate, previousVerifiedRate),
          state: sectionState,
        },
        metric(
          "users.banned_users",
          current.bannedUsers,
          previous.bannedUsers,
          sectionState,
          this.calculations,
        ),
      ],
      growthTrend: this.charts.toChart({
        id: "users.growth_trend",
        title: "User growth",
        chartType: "bar",
        points: growthPoints,
        a11ySummary: `${current.newUsers} users joined in the selected range.`,
        state: sectionState,
      }),
      roleDistribution: this.charts.toChart({
        id: "users.role_distribution",
        title: "Role distribution",
        chartType: "bar",
        points: rolePoints,
        a11ySummary: `${totalRoles} users are represented across ${rolePoints.length} roles.`,
        state: sectionState,
      }),
      activityHeatmap: this.charts.toChart({
        id: "users.activity_heatmap",
        title: "24x7 activity heatmap",
        chartType: "heatmap",
        points: heatmap,
        a11ySummary: `${activityEvents.length} progress events were bucketed by UTC day and hour.`,
        state: activityEvents.length === 0
          ? { ...sectionState, status: "empty", message: "No activity events in range." }
          : sectionState,
      }),
      peakActivity: this.findPeakActivity({
        heatmap,
        monthlyActivity: monthlyPoints,
        state: sectionState,
      }),
      monthlyActivity: this.charts.toChart({
        id: "users.monthly_activity",
        title: "Monthly activity",
        chartType: "bar",
        points: monthlyPoints,
        a11ySummary: `${monthlyPoints.length} monthly activity buckets are available.`,
        state: sectionState,
      }),
      registrationTimeline: this.charts.toChart({
        id: "users.registration_timeline",
        title: "Registration timeline",
        chartType: "bar",
        points: growthPoints,
        a11ySummary: `${growthPoints.length} registration buckets are available.`,
        state: sectionState,
      }),
      managementTable: {
        id: "users.management_table",
        rows: managementRows.map((row) => ({
          userId: row.userId,
          email: row.email,
          name: row.name,
          role: normalizeRole(row.role),
          createdAt: toDate(row.createdAt).toISOString(),
          isEmailVerified: row.isEmailVerified,
          isBanned: row.isBanned,
          adminHref: `/admin/users/${row.userId}`,
        })),
        page: query.page,
        pageSize: query.pageSize,
        totalRows: managementRows.length,
        sort: query.sort ?? "createdAt",
        direction: query.direction,
        state: managementRows.length === 0
          ? { ...sectionState, status: "empty", message: "No users found for this filter." }
          : sectionState,
      },
    };

    return {
      pageId: "users",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: {
        current: 6,
        stale: 0,
        very_stale: 0,
        unavailable: 0,
      },
      redactionNotes: [],
    } satisfies ExecutivePageResponse<UsersSections>;
  }

  buildTechnicalHealthReadModel({
    query,
    freshness,
    auditLog,
    health,
    generatedAt = new Date(),
  }: BuildTechnicalHealthReadModelInput): TechnicalHealthReadModel {
    const fallbackState = defaultReadyState(generatedAt);
    const freshnessRows: TechnicalFreshnessRow[] = freshness.map((record) => {
      const freshnessRecord = {
        sectionId: record.sectionId,
        sourceKey: record.sourceKey,
        status: record.status,
        lastSuccessfulAt: record.lastSuccessfulAt ? toDate(record.lastSuccessfulAt) : null,
        lastAttemptedAt: toDate(record.lastAttemptedAt),
        lastErrorCode: record.lastErrorCode,
        lastQueryDurationMs: record.lastQueryDurationMs,
        rollingP95DurationMs: record.rollingP95DurationMs,
      };
      return {
        sectionId: record.sectionId,
        sourceKey: record.sourceKey,
        status: record.status,
        lastSuccessfulAt: freshnessRecord.lastSuccessfulAt?.toISOString() ?? null,
        lastAttemptedAt: freshnessRecord.lastAttemptedAt.toISOString(),
        lastErrorCode: record.lastErrorCode,
        lastQueryDurationMs: record.lastQueryDurationMs,
        rollingP95DurationMs: record.rollingP95DurationMs,
        state: {
          ...this.freshnessService.toSectionState(freshnessRecord),
          status: this.freshnessService.latencyStatus(freshnessRecord),
        },
      };
    });
    const freshnessSummary = this.freshnessService.summarize(
      freshnessRows.map((row) => ({
        sectionId: row.sectionId,
        sourceKey: row.sourceKey,
        status: row.status,
        lastSuccessfulAt: row.lastSuccessfulAt ? new Date(row.lastSuccessfulAt) : null,
        lastAttemptedAt: new Date(row.lastAttemptedAt),
        lastErrorCode: row.lastErrorCode,
        lastQueryDurationMs: row.lastQueryDurationMs,
        rollingP95DurationMs: row.rollingP95DurationMs,
      })),
    );
    const degraded = health.emailFailed > 0 || health.openActionItems > 0;
    const pipelineState: ExecutiveSectionState = {
      ...fallbackState,
      status: degraded ? "partial" : "ready",
      message: degraded ? "Operational queues require attention." : undefined,
    };
    const emailState: ExecutiveSectionState = {
      ...fallbackState,
      status:
        health.emailProviders.some((provider) => provider.state !== "closed") ||
        health.emailFailed > 0
          ? "partial"
          : "ready",
    };
    const securityState: ExecutiveSectionState = {
      ...fallbackState,
      status: health.bannedUsers > 0 ? "partial" : "ready",
    };
    const auditRows: TechnicalAuditRow[] = auditLog.map((row) => ({
      ...row,
      createdAt: toDate(row.createdAt).toISOString(),
    }));
    const latencyPoints: TechnicalQueryLatencyPoint[] = freshnessRows.map((row) => ({
      sectionId: row.sectionId,
      lastQueryDurationMs: row.lastQueryDurationMs,
      rollingP95DurationMs: row.rollingP95DurationMs,
    }));

    const sections: TechnicalHealthSections = {
      freshnessGrid: {
        id: "technical.freshness_grid",
        rows: freshnessRows,
        page: query.page,
        pageSize: query.pageSize,
        totalRows: freshnessRows.length,
        sort: "status",
        direction: "desc",
        state: fallbackState,
      },
      pipelineHealth: {
        progressEvents: health.progressEvents,
        emailQueued: health.emailQueued,
        emailFailed: health.emailFailed,
        openActionItems: health.openActionItems,
        state: pipelineState,
      } satisfies TechnicalPipelineHealth,
      adminAuditLog: {
        id: "technical.admin_audit_log",
        rows: auditRows,
        page: query.page,
        pageSize: query.pageSize,
        totalRows: auditRows.length,
        sort: "createdAt",
        direction: "desc",
        state: fallbackState,
      },
      platformUsage: {
        activeSessions: health.activeSessions,
        activeUsers: health.activeUsers,
        progressEvents: health.progressEvents,
        state: fallbackState,
      } satisfies TechnicalPlatformUsage,
      securitySignals: {
        bannedUsers: health.bannedUsers,
        unverifiedUsers: health.unverifiedUsers,
        state: securityState,
      } satisfies TechnicalSecuritySignals,
      emailPipelineHealth: {
        queued: health.emailQueued,
        accepted: health.emailAccepted,
        failed: health.emailFailed,
        providers: health.emailProviders.map((provider) => ({
          provider: provider.provider,
          state: provider.state,
          failureCount: provider.failureCount,
          successCount: provider.successCount,
          cooldownUntil: provider.cooldownUntil ? toDate(provider.cooldownUntil).toISOString() : null,
          updatedAt: toDate(provider.updatedAt).toISOString(),
        })),
        state: emailState,
      } satisfies TechnicalEmailHealth,
      queryLatency: this.charts.toChart({
        id: "technical.query_latency",
        title: "Query latency",
        chartType: "bar",
        points: latencyPoints,
        a11ySummary: `${latencyPoints.length} section latency records are available.`,
        state: fallbackState,
      }),
    };

    return {
      pageId: "technical_health",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary,
      redactionNotes: [],
    } satisfies ExecutivePageResponse<TechnicalHealthSections>;
  }

  buildCourseSignals(input: {
    leaderboard: readonly CourseLeaderboardRow[];
    qualityRows?: readonly CourseQualitySnapshot[];
    state: ExecutiveSectionState;
  }): ProblemCourseSignal[] {
    const qualityByCourseId = new Map(
      (input.qualityRows ?? []).map((row) => [row.courseId, row] as const),
    );
    return input.leaderboard.flatMap((course) => {
      const signals: ProblemCourseSignal[] = [];
      const quality = qualityByCourseId.get(course.courseId);
      if (course.enrollments >= 10 && (course.completionRate ?? 0) < 0.2) {
        signals.push({
          courseId: course.courseId,
          title: course.title,
          severity: "high",
          message: "High enrollment with low completion rate.",
          value: course.completionRate,
          state: input.state,
        });
      }
      if (course.status !== "active" && course.status !== "published") {
        signals.push({
          courseId: course.courseId,
          title: course.title,
          severity: "low",
          message: "Course is not currently active.",
          value: null,
          state: input.state,
        });
      }
      if (quality && !quality.hasThumbnail) {
        signals.push({
          courseId: course.courseId,
          title: course.title,
          severity: "medium",
          message: "Course is missing a thumbnail.",
          value: null,
          state: input.state,
        });
      }
      if (quality && !quality.ownerId) {
        signals.push({
          courseId: course.courseId,
          title: course.title,
          severity: "medium",
          message: "Course has no owner attribution.",
          value: null,
          state: input.state,
        });
      }
      return signals;
    });
  }

  buildCoursesLessonsReadModel({
    query,
    current,
    previous,
    leaderboard,
    categoryDistribution,
    contentQualityRows = [],
    managementRows = [],
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
  }: BuildCoursesLessonsReadModelInput): CoursesLessonsReadModel {
    const completionRate =
      this.calculations.calculateRate(current.totalCompletions, current.totalEnrollments) ??
      null;
    const previousCompletionRate =
      this.calculations.calculateRate(previous.totalCompletions, previous.totalEnrollments) ??
      null;
    const categoryTotal = categoryDistribution.reduce((sum, item) => sum + item.value, 0);
    const categoryPoints: CourseCategoryDistributionPoint[] = categoryDistribution.map(
      (item) => ({
        category: item.category,
        value: item.value,
        rate: this.calculations.calculateRate(item.value, categoryTotal),
      }),
    );
    const qualityByCourseId = new Map(contentQualityRows.map((row) => [row.courseId, row] as const));
    const leaderboardRows: CourseLeaderboardRow[] = leaderboard.map((course) => ({
      ...course,
      qualityFlags: courseQualityFlags({
        course,
        quality: qualityByCourseId.get(course.courseId),
      }),
    }));
    const signals = this.buildCourseSignals({
      leaderboard: leaderboardRows,
      qualityRows: contentQualityRows,
      state: sectionState,
    });
    const sections: CoursesLessonsSections = {
      kpis: [
        metric("courses.total_courses", current.totalCourses, previous.totalCourses, sectionState, this.calculations),
        metric("courses.active_courses", current.activeCourses, previous.activeCourses, sectionState, this.calculations),
        metric("courses.total_enrollments", current.totalEnrollments, previous.totalEnrollments, sectionState, this.calculations),
        {
          definitionId: "courses.completion_rate",
          value: completionRate,
          previousValue: previousCompletionRate,
          ...this.calculations.calculateDelta(completionRate, previousCompletionRate),
          state: sectionState,
        },
      ],
      courseLeaderboard: {
        id: "courses.course_leaderboard",
        rows: leaderboardRows,
        page: query.page,
        pageSize: query.pageSize,
        totalRows: leaderboardRows.length,
        sort: query.sort ?? "enrollments",
        direction: query.direction,
        state: sectionState,
      },
      categoryDistribution: this.charts.toChart({
        id: "courses.category_distribution",
        title: "Category distribution",
        chartType: "bar",
        points: categoryPoints,
        a11ySummary: `${categoryTotal} courses represented across ${categoryPoints.length} categories.`,
        state: sectionState,
      }),
      problemCourseSignals: signals,
      contentQualityIndicators: signals.filter((signal) => signal.message.includes("thumbnail") || signal.message.includes("owner")),
      courseManagementLinks: leaderboardRows.map((course): CourseManagementLink => ({
        courseId: course.courseId,
        title: course.title,
        href: `/admin/courses/${course.courseId}`,
        status: course.status,
      })),
      managementTable: {
        id: "courses.management_table",
        rows: managementRows.map((row) => ({
          courseId: row.courseId,
          title: row.title,
          category: row.category,
          status: row.status,
          ownerId: row.ownerId,
          createdAt: row.createdAt ? toDate(row.createdAt).toISOString() : null,
          updatedAt: row.updatedAt ? toDate(row.updatedAt).toISOString() : null,
          lessons: row.lessons,
          enrollments: row.enrollments,
          completionRate: this.calculations.calculateRate(row.completions, row.enrollments),
          adminHref: `/admin/courses/${row.courseId}`,
        })),
        page: query.page,
        pageSize: query.pageSize,
        totalRows: managementRows.length,
        sort: query.sort ?? "updatedAt",
        direction: query.direction,
        state: managementRows.length === 0
          ? { ...sectionState, status: "empty", message: "No courses found for this filter." }
          : sectionState,
      },
    };

    return {
      pageId: "courses_lessons",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: { current: 5, stale: 0, very_stale: 0, unavailable: 0 },
      redactionNotes: [],
    } satisfies ExecutivePageResponse<CoursesLessonsSections>;
  }

  buildFinanceReadModel({
    query,
    current,
    previous,
    courses,
    selectedCourse = null,
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
  }: BuildFinanceReadModelInput): FinanceReadModel {
    const refundRate = this.calculations.calculateRate(current.refundedRevenue, current.grossRevenue) ?? null;
    const previousRefundRate = this.calculations.calculateRate(
      previous.refundedRevenue,
      previous.grossRevenue,
    ) ?? null;
    const completionRate = this.calculations.calculateRate(current.completions, current.enrollments) ?? null;
    const averageRevenuePerActiveLearner = current.activeLearners > 0
      ? current.grossRevenue / current.activeLearners
      : null;
    const previousAverageRevenuePerActiveLearner = previous.activeLearners > 0
      ? previous.grossRevenue / previous.activeLearners
      : null;
    const toPerformanceRow = (course: FinanceCourseSnapshot): FinanceCoursePerformanceRow => {
      const netRevenue = Math.max(0, course.grossRevenue - course.refundedRevenue);
      const courseRefundRate = this.calculations.calculateRate(course.refundedRevenue, course.grossRevenue);
      const courseCompletionRate = this.calculations.calculateRate(course.completions, course.enrollments);
      const profitabilityProxy =
        netRevenue + (course.completions * 50) - (course.supportInquiryCount * 25);
      return {
        courseId: course.courseId,
        title: course.title,
        category: course.category,
        grossRevenue: course.grossRevenue,
        refundedRevenue: course.refundedRevenue,
        netRevenue,
        enrollments: course.enrollments,
        completions: course.completions,
        completionRate: courseCompletionRate,
        refundRate: courseRefundRate,
        supportInquiryCount: course.supportInquiryCount,
        profitabilityProxy,
        highRefundRate: (courseRefundRate ?? 0) >= highRefundThreshold,
        adminHref: `/admin/courses/${course.courseId}`,
      };
    };

    const normalizedSort = this.normalizeFinanceSort(query.sort);
    const courseRows: FinanceCoursePerformanceRow[] = this.sortFinancePerformanceRows(
      courses.map(toPerformanceRow),
      normalizedSort,
      query.direction,
    );

    const selectedRow =
      selectedCourse
        ? toPerformanceRow(selectedCourse)
        : query.courseId
          ? courseRows.find((row) => row.courseId === query.courseId) ?? null
          : null;
    const selectedCourseDetail = selectedRow;

    const summary: FinanceSummary = {
      grossRevenue: current.grossRevenue,
      netRevenue: Math.max(0, current.grossRevenue - current.refundedRevenue),
      refundedRevenue: current.refundedRevenue,
      refundRate,
      averageRevenuePerActiveLearner,
      paidEnrollments: current.paidEnrollments,
      manualEnrollments: current.manualEnrollments,
      activeLearners: current.activeLearners,
      supportInquiries: current.supportInquiries,
      completionRate,
    };

    const sections: FinanceSections = {
      kpis: [
        {
          definitionId: "finance.gross_revenue",
          value: current.grossRevenue,
          previousValue: previous.grossRevenue,
          ...this.calculations.calculateDelta(current.grossRevenue, previous.grossRevenue),
          state: sectionState,
        },
        {
          definitionId: "finance.net_revenue",
          value: summary.netRevenue,
          previousValue: Math.max(0, previous.grossRevenue - previous.refundedRevenue),
          ...this.calculations.calculateDelta(
            summary.netRevenue,
            Math.max(0, previous.grossRevenue - previous.refundedRevenue),
          ),
          state: sectionState,
        },
        {
          definitionId: "finance.refund_rate",
          value: refundRate,
          previousValue: previousRefundRate,
          ...this.calculations.calculateDelta(refundRate, previousRefundRate),
          state: sectionState,
        },
        {
          definitionId: "finance.avg_revenue_per_active_learner",
          value: averageRevenuePerActiveLearner,
          previousValue: previousAverageRevenuePerActiveLearner,
          ...this.calculations.calculateDelta(
            averageRevenuePerActiveLearner,
            previousAverageRevenuePerActiveLearner,
          ),
          state: sectionState,
        },
        {
          definitionId: "finance.paid_enrollments",
          value: current.paidEnrollments,
          previousValue: previous.paidEnrollments,
          ...this.calculations.calculateDelta(current.paidEnrollments, previous.paidEnrollments),
          state: sectionState,
        },
        {
          definitionId: "finance.manual_enrollments",
          value: current.manualEnrollments,
          previousValue: previous.manualEnrollments,
          ...this.calculations.calculateDelta(current.manualEnrollments, previous.manualEnrollments),
          state: sectionState,
        },
      ],
      financeSummary: summary,
      courseBusinessPerformance: {
        id: "finance.course_business_performance",
        rows: courseRows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
        page: query.page,
        pageSize: query.pageSize,
        totalRows: courseRows.length,
        sort: normalizedSort,
        direction: query.direction,
        state: courseRows.length === 0
          ? { ...sectionState, status: "empty", message: "No course finance data found." }
          : sectionState,
      },
      selectedCourseDetail,
    };

    return {
      pageId: "finance",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: { current: 6, stale: 0, very_stale: 0, unavailable: 0 },
      redactionNotes: [],
    } satisfies ExecutivePageResponse<FinanceSections>;
  }

  buildLessonRows(
    lessons: readonly Omit<LessonAnalyticsRow, "completionRate" | "state">[],
    state: ExecutiveSectionState,
  ): LessonAnalyticsRow[] {
    return lessons.map((lesson) => ({
      ...lesson,
      completionRate: this.calculations.calculateRate(lesson.completions, lesson.viewers),
      state,
    }));
  }

  findCriticalDropFlags(
    lessons: readonly LessonAnalyticsRow[],
  ): CriticalDropFlag[] {
    const flags: CriticalDropFlag[] = [];
    for (let index = 1; index < lessons.length; index += 1) {
      const previous = lessons[index - 1];
      const current = lessons[index];
      if (previous.completionRate === null || current.completionRate === null) continue;
      const drop = previous.completionRate - current.completionRate;
      if (drop > 0.2) {
        flags.push({
          lessonId: current.lessonId,
          title: current.title,
          previousLessonId: previous.lessonId,
          dropPercentagePoints: drop,
          severity: drop >= 0.4 ? "critical" : "high",
          state: current.state,
        });
      }
    }
    return flags;
  }

  buildLessonDrilldownReadModel({
    query,
    lessons,
    contentQualityLessons = [],
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
  }: BuildLessonDrilldownReadModelInput): LessonDrilldownReadModel {
    const rows = this.buildLessonRows(lessons, sectionState).sort(
      (a, b) => a.sortIndex - b.sortIndex,
    );
    const firstViewers = rows[0]?.viewers ?? 0;
    const funnelPoints: LessonCompletionFunnelPoint[] = rows.map((lesson) => ({
      label: lesson.title,
      value: lesson.completions,
      rate: this.calculations.calculateRate(lesson.completions, firstViewers),
    }));
    const dropFlags = this.findCriticalDropFlags(rows);
    const dropByLessonId = new Map(dropFlags.map((flag) => [flag.lessonId, flag] as const));
    const qualityRows = contentQualityLessons.map((lesson) => {
      const drop = dropByLessonId.get(lesson.lessonId) ?? null;
      const updatedAt = toDate(lesson.updatedAt);
      const flags = lessonQualityFlags({
        lesson,
        dropOff: drop ?? null,
        now: generatedAt,
      });
      return {
        lessonId: lesson.lessonId,
        title: lesson.title,
        status: lesson.status,
        hasVideo: Boolean(lesson.videoUrl),
        updatedAt: updatedAt.toISOString(),
        issueFlags: flags,
        dropOffLabel: drop ? `${Math.round(drop.dropPercentagePoints * 100)}% drop` : null,
        state: flags.length === 0 ? sectionState : { ...sectionState, message: "Content review checklist contains flagged lessons." },
      };
    });
    const sections: LessonDrilldownSections = {
      lessonTable: {
        id: "courses.lesson_table",
        rows,
        page: query.page,
        pageSize: query.pageSize,
        totalRows: rows.length,
        sort: "sortIndex",
        direction: "asc",
        state: sectionState,
      },
      completionFunnel: this.charts.toChart({
        id: "courses.lesson_completion_funnel",
        title: "Lesson completion funnel",
        chartType: "funnel",
        points: funnelPoints,
        a11ySummary: `${rows.length} lessons are represented in the completion funnel.`,
        state: sectionState,
      }),
      criticalDropFlags: dropFlags,
      contentQualityChecklist: {
        id: "courses.content_quality_checklist",
        rows: qualityRows,
        page: query.page,
        pageSize: query.pageSize,
        totalRows: qualityRows.length,
        sort: "updatedAt",
        direction: "desc",
        state: qualityRows.length === 0
          ? { ...sectionState, status: "empty", message: "No content quality checklist data available." }
          : sectionState,
      },
    };

    return {
      pageId: "courses_lessons",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: { current: 3, stale: 0, very_stale: 0, unavailable: 0 },
      redactionNotes: [],
    } satisfies ExecutivePageResponse<LessonDrilldownSections>;
  }

  buildOpportunitiesAiReadModel({
    query,
    opportunities,
    aiSearch,
    registeredEvents,
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
  }: BuildOpportunitiesAiReadModelInput): OpportunitiesAiReadModel {
    const aiState: ExecutiveSectionState = aiSearch?.totalSearches === null || aiSearch === undefined
      ? {
        ...sectionState,
        status: "data_gap",
        freshness: "unavailable",
        message: "AI search instrumentation is missing for this range.",
      }
      : aiSearch.totalSearches === 0
        ? { ...sectionState, status: "empty", message: "No AI searches in range." }
        : sectionState;
    const zeroResultRate = aiSearch?.totalSearches === null || aiSearch === undefined
      ? null
      : this.calculations.calculateRate(aiSearch.zeroResultSearches ?? 0, aiSearch.totalSearches);
    const errorRate = aiSearch?.totalSearches === null || aiSearch === undefined
      ? null
      : this.calculations.calculateRate(aiSearch.errorSearches ?? 0, aiSearch.totalSearches);
    const aiQualitySignals: AiQualitySignal[] = [];
    if (zeroResultRate !== null && zeroResultRate >= 0.25) {
      aiQualitySignals.push({
        id: "ai.zero_result_rate",
        label: "Zero-result rate",
        severity: zeroResultRate >= 0.5 ? "critical" : "high",
        value: zeroResultRate,
        message: "AI search zero-result rate is above the healthy threshold.",
        state: aiState,
      });
    }
    if (errorRate !== null && errorRate >= 0.1) {
      aiQualitySignals.push({
        id: "ai.error_rate",
        label: "Search error rate",
        severity: errorRate >= 0.25 ? "critical" : "high",
        value: errorRate,
        message: "AI search errors are elevated for the selected period.",
        state: aiState,
      });
    }
    if ((aiSearch?.averageLatencyMs ?? null) !== null && (aiSearch?.averageLatencyMs ?? 0) > 3000) {
      aiQualitySignals.push({
        id: "ai.latency",
        label: "Search latency",
        severity: (aiSearch?.averageLatencyMs ?? 0) > 6000 ? "critical" : "medium",
        value: aiSearch?.averageLatencyMs ?? null,
        message: "Average AI search latency is above the target response budget.",
        state: aiState,
      });
    }

    const rows = opportunities.flatMap((opportunity) => {
      const issues: OpportunityQualityQueueRow[] = [];

      if (opportunity.expired) {
        issues.push(opportunityIssue({
          opportunity,
          issueType: "expired",
          severity: "high",
          recommendedAction: "Archive or refresh the deadline before it appears in discovery.",
          state: sectionState,
          calculations: this.calculations,
        }));
      }

      if (opportunity.brokenLink) {
        issues.push(opportunityIssue({
          opportunity,
          issueType: "broken_link",
          severity: "high",
          recommendedAction: "Verify the destination URL and replace it with a working application link.",
          state: sectionState,
          calculations: this.calculations,
        }));
      }

      if (opportunity.missingMetadataFields.length > 0) {
        issues.push(opportunityIssue({
          opportunity,
          issueType: "missing_metadata",
          severity: "medium",
          recommendedAction: `Add missing metadata: ${opportunity.missingMetadataFields.join(", ")}.`,
          state: sectionState,
          calculations: this.calculations,
        }));
      }

      const applyRate = this.calculations.calculateRate(
        opportunity.applyClicks,
        opportunity.savedCount,
      );
      if (
        opportunity.savedCount >= highSaveThreshold &&
        (applyRate === null || applyRate < lowApplyRateThreshold)
      ) {
        issues.push(opportunityIssue({
          opportunity,
          issueType: "high_save_low_apply",
          severity: "medium",
          recommendedAction: "Review copy, eligibility clarity, and application friction for this saved opportunity.",
          state: sectionState,
          calculations: this.calculations,
        }));
      }

      return issues;
    }).sort((left, right) => {
      const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityRank[left.severity] - severityRank[right.severity]
        || right.savedCount - left.savedCount
        || left.title.localeCompare(right.title);
    });

    const queueState: ExecutiveSectionState = opportunities.length === 0
      ? {
        ...sectionState,
        status: "data_gap",
        freshness: "unavailable",
        message: "No opportunity quality instrumentation was found for this range.",
      }
      : rows.length === 0
        ? { ...sectionState, status: "empty", message: "No opportunity quality issues found." }
        : sectionState;
    const scopedRows = rows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);
    const expired = rows.filter((row) => row.issueType === "expired").length;
    const brokenLinks = rows.filter((row) => row.issueType === "broken_link").length;
    const missingMetadata = rows.filter((row) => row.issueType === "missing_metadata").length;
    const highSaveLowApply = rows.filter((row) => row.issueType === "high_save_low_apply").length;

    // -----------------------------------------------------------------------
    // Registered events (US12)
    // -----------------------------------------------------------------------
    const eventDataGapState: ExecutiveSectionState = {
      ...sectionState,
      status: "data_gap",
      freshness: "unavailable",
      message:
        "Event registration data is not available. Connect registeredEvents to enable this section.",
    };
    const hasEventData = registeredEvents !== undefined;
    const eventSectionState: ExecutiveSectionState = hasEventData
      ? registeredEvents.length === 0
        ? { ...sectionState, status: "empty", message: "No events with registrations in this period." }
        : sectionState
      : eventDataGapState;

    const eventRows: RegisteredEventRow[] = [...(registeredEvents ?? [])]
      .sort((a: RegisteredEventSnapshot, b: RegisteredEventSnapshot) => b.registrations - a.registrations)
      .map((ev: RegisteredEventSnapshot): RegisteredEventRow => {
        const attended = ev.attendanceTracked ? (ev.attendees ?? 0) : null;
        const noShowRate =
          ev.attendanceTracked && attended !== null
            ? this.calculations.calculateRate(
              Math.max(0, ev.registrations - attended),
              ev.registrations,
            )
            : null;
        const signupConvRate =
          ev.postEventSignups !== null
            ? this.calculations.calculateRate(ev.postEventSignups, ev.registrations)
            : null;
        const enrollConvRate =
          ev.postEventEnrollments !== null
            ? this.calculations.calculateRate(ev.postEventEnrollments, ev.registrations)
            : null;
        return {
          eventId: ev.eventId,
          title: ev.title,
          registrations: ev.registrations,
          attendees: ev.attendanceTracked ? ev.attendees : null,
          attendanceState: ev.attendanceTracked ? "ready" : "data_gap",
          noShowRate,
          postEventSignupConversionRate: signupConvRate,
          postEventEnrollmentConversionRate: enrollConvRate,
        };
      });

    const totalRegistrations = eventRows.reduce((sum, r) => sum + r.registrations, 0);
    const scopedEventRows = eventRows.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    );

    const registeredEventsSummary: RegisteredEventsSummary = {
      totalRegistrations,
      uniqueEventsWithRegistrations: eventRows.filter((r) => r.registrations > 0).length,
      state: eventSectionState,
    };

    // -----------------------------------------------------------------------
    // KPIs and sections
    // -----------------------------------------------------------------------
    const kpis: ExecutiveMetricValue[] = [
      {
        definitionId: "ai.total_searches",
        value: aiSearch?.totalSearches ?? null,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: aiState,
      },
      {
        definitionId: "ai.zero_result_rate",
        value: zeroResultRate,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: aiState,
      },
      {
        definitionId: "ai.error_rate",
        value: errorRate,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: aiState,
      },
      {
        definitionId: "ai.estimated_cost",
        value: aiSearch?.estimatedCost ?? null,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: aiState,
      },
      {
        definitionId: "opportunities.cleanup_items",
        value: rows.length,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: queueState,
      },
      {
        definitionId: "opportunities.broken_links",
        value: brokenLinks,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: queueState,
      },
      {
        definitionId: "opportunities.expired",
        value: expired,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: queueState,
      },
      {
        definitionId: "opportunities.high_save_low_apply",
        value: highSaveLowApply,
        previousValue: null,
        deltaValue: null,
        deltaPercent: null,
        state: queueState,
      },
    ];

    const sections: OpportunitiesAiSections = {
      kpis,
      aiQualitySummary: {
        totalSearches: aiSearch?.totalSearches ?? null,
        zeroResultRate,
        errorRate,
        averageLatencyMs: aiSearch?.averageLatencyMs ?? null,
        estimatedCost: aiSearch?.estimatedCost ?? null,
        feedbackCount: aiSearch?.feedbackCount ?? null,
        state: aiState,
      },
      aiSearchTrend: this.charts.toChart({
        id: "ai.search_trend",
        title: "AI search trend",
        chartType: "bar",
        points: aiSearch?.trend ?? [],
        a11ySummary: aiState.status === "data_gap"
          ? "AI search trend instrumentation is unavailable."
          : `${aiSearch?.trend.length ?? 0} AI search trend points are available.`,
        state: aiState,
      }),
      aiUsageByUser: {
        id: "ai.usage_by_user",
        rows: (aiSearch?.usageByUser ?? []).map((row) => ({ ...row, state: aiState })),
        page: query.page,
        pageSize: query.pageSize,
        totalRows: aiSearch?.usageByUser.length ?? 0,
        sort: "searches",
        direction: "desc",
        state: aiState,
      },
      aiQualitySignals,
      opportunityQualitySummary: {
        cleanupItems: rows.length,
        expired,
        brokenLinks,
        missingMetadata,
        highSaveLowApply,
        state: queueState,
      },
      opportunityCleanupQueue: {
        id: "opportunities.cleanup_queue",
        rows: scopedRows,
        page: query.page,
        pageSize: query.pageSize,
        totalRows: rows.length,
        sort: "severity",
        direction: "desc",
        state: queueState,
      },
      registeredEventsSummary,
      registeredEventsTable: {
        id: "events.registered_events_table",
        rows: scopedEventRows,
        page: query.page,
        pageSize: query.pageSize,
        totalRows: eventRows.length,
        sort: "registrations",
        direction: "desc",
        state: eventSectionState,
      },
    };

    const eventFreshAvailable = hasEventData ? 2 : 0;
    const eventFreshUnavailable = hasEventData ? 0 : 2;

    return {
      pageId: "opportunities_ai",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: {
        current:
          (queueState.status === "data_gap" ? 0 : 3) +
          (aiState.status === "data_gap" ? 0 : 4) +
          eventFreshAvailable,
        stale: 0,
        very_stale: 0,
        unavailable:
          (queueState.status === "data_gap" ? 3 : 0) +
          (aiState.status === "data_gap" ? 4 : 0) +
          eventFreshUnavailable,
      },
      redactionNotes: [],
    } satisfies ExecutivePageResponse<OpportunitiesAiSections>;
  }

  buildPublicGrowthReadModel({
    query,
    current,
    websiteAnalytics,
    cohortRetention = [],
    publicImpactMetrics = [],
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
  }: BuildPublicGrowthReadModelInput): PublicGrowthReadModel {
    const growthPoints: GrowthFunnelPoint[] = [
      funnelPoint({
        id: "signups",
        label: "Signups",
        value: current.signups,
        previousValue: null,
        state: sectionState,
        calculations: this.calculations,
      }),
      funnelPoint({
        id: "enrollments",
        label: "Enrollments",
        value: current.enrollments,
        previousValue: current.signups,
        state: sectionState,
        calculations: this.calculations,
      }),
      funnelPoint({
        id: "completions",
        label: "Course completions",
        value: current.completions,
        previousValue: current.enrollments,
        state: sectionState,
        calculations: this.calculations,
      }),
    ];
    const websitePoints: GrowthFunnelPoint[] = [
      funnelPoint({
        id: "website_visits",
        label: "Website visits",
        value: current.websiteVisits,
        previousValue: null,
        state: sectionState,
        calculations: this.calculations,
      }),
      funnelPoint({
        id: "signup_starts",
        label: "Signup starts",
        value: current.signupStarts,
        previousValue: current.websiteVisits,
        state: sectionState,
        calculations: this.calculations,
      }),
      funnelPoint({
        id: "signups",
        label: "Signups",
        value: current.signups,
        previousValue: current.signupStarts,
        state: sectionState,
        calculations: this.calculations,
      }),
      funnelPoint({
        id: "opportunity_actions",
        label: "Opportunity actions",
        value: current.opportunityActions,
        previousValue: current.signups,
        state: sectionState,
        calculations: this.calculations,
      }),
    ];
    const websiteHasGap = websitePoints.some((point) => point.value === null);
    const websiteAnalyticsState: ExecutiveSectionState = websiteHasGap
      ? {
        ...sectionState,
        status: "data_gap",
        freshness: "unavailable",
        message: "Website instrumentation is incomplete.",
      }
      : sectionState;
    const signupConversion = current.websiteVisits === null
      ? null
      : this.calculations.calculateRate(current.signups, current.websiteVisits);
    const enrollmentConversion = this.calculations.calculateRate(
      current.enrollments,
      current.signups,
    );
    const sections: PublicGrowthSections = {
      growthFunnel: {
        id: "growth.core_funnel",
        title: "Learner journey funnel",
        chartType: "funnel",
        points: growthPoints,
        a11ySummary: `${current.signups} signups, ${current.enrollments} enrollments, and ${current.completions} completions in range.`,
        isZoomed: false,
        state: sectionState,
      },
      websiteFunnel: {
        id: "growth.website_funnel",
        title: "Website funnel",
        chartType: "funnel",
        points: websitePoints,
        a11ySummary: websiteHasGap
          ? "Website instrumentation is incomplete for this range."
          : `${current.websiteVisits} visits produced ${current.signups} signups.`,
        isZoomed: false,
        state: websiteAnalyticsState,
      },
      websiteAnalyticsSummary: {
        visits: current.websiteVisits,
        ctaClicks: websiteAnalytics?.ctaClicks ?? null,
        signupStarts: current.signupStarts,
        signupConversionRate: signupConversion,
        state: websiteAnalyticsState,
      },
      trafficSources: this.charts.toChart({
        id: "growth.traffic_sources",
        title: "Traffic sources",
        chartType: "bar",
        points: distributionPoints(
          websiteAnalytics?.trafficSources ?? [],
          current.websiteVisits,
          this.calculations,
        ),
        a11ySummary: websiteHasGap
          ? "Traffic source instrumentation is unavailable."
          : `${websiteAnalytics?.trafficSources.length ?? 0} traffic sources are represented.`,
        state: websiteAnalyticsState,
      }),
      deviceBreakdown: this.charts.toChart({
        id: "growth.device_breakdown",
        title: "Device breakdown",
        chartType: "bar",
        points: distributionPoints(
          websiteAnalytics?.deviceBreakdown ?? [],
          current.websiteVisits,
          this.calculations,
        ),
        a11ySummary: websiteHasGap
          ? "Device instrumentation is unavailable."
          : `${websiteAnalytics?.deviceBreakdown.length ?? 0} device segments are represented.`,
        state: websiteAnalyticsState,
      }),
      campaignPerformance: this.charts.toChart({
        id: "growth.campaign_performance",
        title: "Campaign performance",
        chartType: "bar",
        points: distributionPoints(
          websiteAnalytics?.campaignPerformance ?? [],
          current.websiteVisits,
          this.calculations,
        ),
        a11ySummary: websiteHasGap
          ? "Campaign instrumentation is unavailable."
          : `${websiteAnalytics?.campaignPerformance.length ?? 0} campaigns are represented.`,
        state: websiteAnalyticsState,
      }),
      ctaPerformance: this.charts.toChart({
        id: "growth.cta_performance",
        title: "CTA performance",
        chartType: "bar",
        points: (websiteAnalytics?.ctaPerformance ?? []).map((point): WebsiteCtaPoint => ({
          ctaId: point.ctaId,
          label: point.label,
          clicks: point.clicks,
          clickRate: current.websiteVisits === null
            ? null
            : this.calculations.calculateRate(point.clicks, current.websiteVisits),
        })),
        a11ySummary: websiteHasGap
          ? "CTA instrumentation is unavailable."
          : `${websiteAnalytics?.ctaPerformance.length ?? 0} CTAs are represented.`,
        state: websiteAnalyticsState,
      }),
      studentReadiness: [
        {
          definitionId: "growth.signup_conversion_rate",
          value: signupConversion,
          previousValue: null,
          deltaValue: null,
          deltaPercent: null,
          state: signupConversion === null
            ? { ...sectionState, status: "data_gap", freshness: "unavailable" }
            : sectionState,
        },
        {
          definitionId: "growth.enrollment_conversion_rate",
          value: enrollmentConversion,
          previousValue: null,
          deltaValue: null,
          deltaPercent: null,
          state: enrollmentConversion === null
            ? { ...sectionState, status: "empty" }
            : sectionState,
        },
      ],
      cohortRetention: this.charts.toChart({
        id: "growth.cohort_retention",
        title: "Cohort retention",
        chartType: "bar",
        points: cohortRetention,
        a11ySummary: `${cohortRetention.length} retention cohorts are available.`,
        state: cohortRetention.length === 0 ? { ...sectionState, status: "empty" } : sectionState,
      }),
      publicImpactMetrics: publicImpactMetrics.map((metricRow) => ({
        metricId: metricRow.metricId,
        label: metricRow.label,
        value: metricRow.manualOverrideValue ?? metricRow.value,
        computedValue: metricRow.computedValue ?? metricRow.value,
        manualOverrideValue: metricRow.manualOverrideValue ?? null,
        sourceDescription: metricRow.sourceDescription ?? "Source details are not configured.",
        ownerId: metricRow.ownerId ?? "unassigned",
        approvalStatus: metricRow.approvalStatus ?? (
          metricRow.status === "approved" ? "approved" : "draft"
        ),
        proposedBy: metricRow.proposedBy ?? null,
        approvedBy: metricRow.approvedBy ?? null,
        approvedAt: toIsoOrNull(metricRow.approvedAt),
        rejectedBy: metricRow.rejectedBy ?? null,
        rejectedAt: toIsoOrNull(metricRow.rejectedAt),
        rejectionReason: metricRow.rejectionReason ?? null,
        auditTrail: metricRow.auditTrail ?? [],
        autoPublish: metricRow.autoPublish ?? false,
        freshnessAt: (metricRow.freshnessAt ? toDate(metricRow.freshnessAt) : generatedAt).toISOString(),
        updatedAt: (metricRow.updatedAt ? toDate(metricRow.updatedAt) : generatedAt).toISOString(),
        state: sectionState,
      })),
    };

    return {
      pageId: "public_growth",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: {
        current: websiteHasGap ? 3 : 8,
        stale: 0,
        very_stale: 0,
        unavailable: websiteHasGap ? 5 : 0,
      },
      redactionNotes: [],
    } satisfies ExecutivePageResponse<PublicGrowthSections>;
  }

  buildTeamOperationsReadModel({
    query,
    inquiries,
    generatedAt = new Date(),
    sectionState = defaultReadyState(generatedAt),
    slaHours = defaultInquirySlaHours,
  }: BuildTeamOperationsReadModelInput): TeamOperationsReadModel {
    const rows = inquiries.map((inquiry) => {
      const submittedAt = toDate(inquiry.submittedAt);
      const hoursSinceSubmission = hoursBetween(generatedAt, submittedAt);
      const nextFollowUpDueAt = new Date(submittedAt.getTime() + slaHours * 3_600_000);
      const isOpen = !["converted", "lost", "resolved", "closed"].includes(inquiry.status);
      const isSlaBreached = isOpen && hoursSinceSubmission > slaHours;
      const severity: "critical" | "high" | "medium" | "low" = isSlaBreached && hoursSinceSubmission >= slaHours * 2
        ? "critical"
        : isSlaBreached
          ? "high"
          : isOpen
            ? "medium"
            : "low";

      return {
        inquiryId: inquiry.inquiryId,
        courseId: inquiry.courseId,
        courseTitle: inquiry.courseTitle,
        status: inquiry.status,
        assignedOwnerId: inquiry.assignedOwnerId,
        sourceChannel: inquiry.sourceChannel ?? "unknown",
        submittedAt: submittedAt.toISOString(),
        hoursSinceSubmission,
        nextFollowUpDueAt: nextFollowUpDueAt.toISOString(),
        isSlaBreached,
        severity,
        state: sectionState,
      };
    }).sort((left, right) => {
      if (left.isSlaBreached !== right.isSlaBreached) return Number(right.isSlaBreached) - Number(left.isSlaBreached);
      return right.hoursSinceSubmission - left.hoursSinceSubmission;
    });
    const tableState: ExecutiveSectionState = rows.length === 0
      ? { ...sectionState, status: "empty", message: "No inquiries found in this range." }
      : sectionState;
    const statusCounts = new Map<string, number>();
    for (const row of rows) {
      statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
    }
    const totalInquiries = rows.length;
    const converted = statusCounts.get("converted") ?? 0;
    const openInquiries = rows.filter((row) => !["converted", "lost", "resolved", "closed"].includes(row.status)).length;
    const overdueFollowUps = rows.filter((row) => row.isSlaBreached).length;
    const ownerRows = Array.from(
      rows.reduce((owners, row) => {
        const owner = owners.get(row.assignedOwnerId) ?? {
          ownerId: row.assignedOwnerId,
          assignedInquiryCount: 0,
          overdueFollowUpCount: 0,
          averageResponseHours: null,
          resolvedCount: 0,
          conversionRate: null,
          state: tableState,
        };
        owner.assignedInquiryCount += 1;
        if (row.isSlaBreached) owner.overdueFollowUpCount += 1;
        if (["converted", "lost", "resolved", "closed"].includes(row.status)) owner.resolvedCount += 1;
        owners.set(row.assignedOwnerId, owner);
        return owners;
      }, new Map<string | null, {
        ownerId: string | null;
        assignedInquiryCount: number;
        overdueFollowUpCount: number;
        averageResponseHours: number | null;
        resolvedCount: number;
        conversionRate: number | null;
        state: ExecutiveSectionState;
      }>()),
    ).map(([, workload]) => ({
      ...workload,
      conversionRate: this.calculations.calculateRate(
        rows.filter((row) => row.assignedOwnerId === workload.ownerId && row.status === "converted").length,
        workload.assignedInquiryCount,
      ),
    })).sort((left, right) => right.overdueFollowUpCount - left.overdueFollowUpCount || right.assignedInquiryCount - left.assignedInquiryCount);
    const statusPoints = Array.from(statusCounts.entries()).map(([status, value]) => ({
      status,
      value,
      rate: this.calculations.calculateRate(value, totalInquiries),
    }));

    const sections: TeamOperationsSections = {
      inquiryPipelineSummary: {
        totalInquiries,
        openInquiries,
        slaBreaches: overdueFollowUps,
        overdueFollowUps,
        conversionRate: this.calculations.calculateRate(converted, totalInquiries),
        state: tableState,
      },
      inquiryStatusFunnel: this.charts.toChart({
        id: "sales.inquiry_status",
        title: "Inquiry status distribution",
        chartType: "bar",
        points: statusPoints,
        a11ySummary: `${totalInquiries} inquiries across ${statusPoints.length} statuses.`,
        state: tableState,
      }),
      inquiryPipeline: {
        id: "sales.inquiry_pipeline",
        rows: rows.slice((query.page - 1) * query.pageSize, query.page * query.pageSize),
        page: query.page,
        pageSize: query.pageSize,
        totalRows: rows.length,
        sort: "sla",
        direction: "desc",
        state: tableState,
      },
      salesSupportWorkload: {
        id: "sales.support_workload",
        rows: ownerRows,
        page: 1,
        pageSize: ownerRows.length || query.pageSize,
        totalRows: ownerRows.length,
        sort: "overdueFollowUpCount",
        direction: "desc",
        state: tableState,
      },
    };

    return {
      pageId: "team_operations",
      query,
      generatedAt: generatedAt.toISOString(),
      sections,
      freshnessSummary: { current: 4, stale: 0, very_stale: 0, unavailable: 0 },
      redactionNotes: ["Inquiry contact details are excluded from the executive read model."],
    } satisfies ExecutivePageResponse<TeamOperationsSections>;
  }
}

export function createExecutiveDashboardService() {
  return new ExecutiveDashboardService();
}
