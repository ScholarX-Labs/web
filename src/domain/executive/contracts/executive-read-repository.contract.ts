import type {
  ExecutiveFreshnessStatus,
  ExecutivePageId,
  ExecutiveSectionState,
  PublicImpactStatus,
} from "./executive-types";
import type { ExecutivePageQuery } from "./executive-query.schemas";

export type ExecutiveMetricValue = {
  definitionId: string;
  value: number | string | null;
  previousValue: number | string | null;
  deltaValue: number | null;
  deltaPercent: number | null;
  state: ExecutiveSectionState;
};

export type ExecutiveChartModel<TPoint extends object> = {
  id: string;
  title: string;
  chartType: string;
  points: readonly TPoint[];
  a11ySummary: string;
  isZoomed: boolean;
  state: ExecutiveSectionState;
};

export type ExecutiveTableModel<TRow extends object> = {
  id: string;
  rows: readonly TRow[];
  page: number;
  pageSize: number;
  totalRows: number;
  sort: string;
  direction: "asc" | "desc";
  state: ExecutiveSectionState;
};

export type ExecutiveFreshnessSummary = Record<ExecutiveFreshnessStatus, number>;

export type ExecutivePageResponse<TSections extends object> = {
  pageId: ExecutivePageId;
  query: ExecutivePageQuery;
  generatedAt: string;
  sections: TSections;
  freshnessSummary: ExecutiveFreshnessSummary;
  redactionNotes: readonly string[];
};

export type EmptyExecutiveSections = Record<string, never>;

export type OverviewTrendPoint = {
  date: string;
  value: number;
  previousValue?: number | null;
};

export type OverviewFunnelPoint = {
  label: string;
  value: number;
  rate: number | null;
};

export type OverviewRiskIndicator = {
  id: string;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  value: number | string | null;
  message: string;
  state: ExecutiveSectionState;
};

export type OverviewSections = {
  kpis: readonly ExecutiveMetricValue[];
  revenueTrend: ExecutiveChartModel<OverviewTrendPoint>;
  completionTrend: ExecutiveChartModel<OverviewTrendPoint>;
  subscriptionFunnel: ExecutiveChartModel<OverviewFunnelPoint>;
  riskIndicators: readonly OverviewRiskIndicator[];
};

export type OverviewReadModel = ExecutivePageResponse<OverviewSections>;
export type UsersTrendPoint = {
  date: string;
  value: number;
};

export type UsersRoleDistributionPoint = {
  role: string;
  value: number;
  rate: number | null;
};

export type UsersActivityHeatmapPoint = {
  dayOfWeek: number;
  hour: number;
  value: number;
};

export type UsersPeakActivity = {
  peakDayOfWeek: number | null;
  peakHour: number | null;
  peakMonth: string | null;
  eventCount: number;
  state: ExecutiveSectionState;
};

export type UsersMonthlyActivityPoint = {
  month: string;
  value: number;
};

export type UserManagementRow = {
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
  createdAt: string;
  isEmailVerified: boolean;
  isBanned: boolean;
  adminHref: string;
};

export type UsersSections = {
  kpis: readonly ExecutiveMetricValue[];
  growthTrend: ExecutiveChartModel<UsersTrendPoint>;
  roleDistribution: ExecutiveChartModel<UsersRoleDistributionPoint>;
  activityHeatmap: ExecutiveChartModel<UsersActivityHeatmapPoint>;
  peakActivity: UsersPeakActivity;
  monthlyActivity: ExecutiveChartModel<UsersMonthlyActivityPoint>;
  registrationTimeline: ExecutiveChartModel<UsersTrendPoint>;
  managementTable: ExecutiveTableModel<UserManagementRow>;
};

export type UsersReadModel = ExecutivePageResponse<UsersSections>;

export type CourseLeaderboardRow = {
  courseId: string;
  title: string;
  category: string;
  status: string;
  enrollments: number;
  completions: number;
  completionRate: number | null;
  revenue: number;
  qualityFlags: readonly string[];
};

export type CourseCategoryDistributionPoint = {
  category: string;
  value: number;
  rate: number | null;
};

export type ProblemCourseSignal = {
  courseId: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  value: number | null;
  state: ExecutiveSectionState;
};

export type ContentQualityChecklistRow = {
  lessonId: string;
  title: string;
  status: string;
  hasVideo: boolean;
  updatedAt: string;
  issueFlags: readonly string[];
  dropOffLabel: string | null;
  state: ExecutiveSectionState;
};

export type CourseManagementLink = {
  courseId: string;
  title: string;
  href: string;
  status: string;
};

export type CourseManagementRow = {
  courseId: string;
  title: string;
  category: string;
  status: string;
  ownerId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lessons: number;
  enrollments: number;
  completionRate: number | null;
  adminHref: string;
};

export type CoursesLessonsSections = {
  kpis: readonly ExecutiveMetricValue[];
  courseLeaderboard: ExecutiveTableModel<CourseLeaderboardRow>;
  categoryDistribution: ExecutiveChartModel<CourseCategoryDistributionPoint>;
  problemCourseSignals: readonly ProblemCourseSignal[];
  contentQualityIndicators: readonly ProblemCourseSignal[];
  courseManagementLinks: readonly CourseManagementLink[];
  managementTable: ExecutiveTableModel<CourseManagementRow>;
};

export type LessonAnalyticsRow = {
  lessonId: string;
  title: string;
  sortIndex: number;
  viewers: number;
  completions: number;
  completionRate: number | null;
  averageWatchedPercentage: number | null;
  state: ExecutiveSectionState;
};

export type LessonCompletionFunnelPoint = {
  label: string;
  value: number;
  rate: number | null;
};

export type CriticalDropFlag = {
  lessonId: string;
  title: string;
  previousLessonId: string | null;
  dropPercentagePoints: number;
  severity: "critical" | "high" | "medium" | "low";
  state: ExecutiveSectionState;
};

export type LessonDrilldownSections = {
  lessonTable: ExecutiveTableModel<LessonAnalyticsRow>;
  completionFunnel: ExecutiveChartModel<LessonCompletionFunnelPoint>;
  criticalDropFlags: readonly CriticalDropFlag[];
  contentQualityChecklist: ExecutiveTableModel<ContentQualityChecklistRow>;
};

export type CoursesLessonsReadModel =
  ExecutivePageResponse<CoursesLessonsSections>;
export type LessonDrilldownReadModel =
  ExecutivePageResponse<LessonDrilldownSections>;
export type LearnerProgressReadModel =
  ExecutivePageResponse<EmptyExecutiveSections>;

export type FinanceCoursePerformanceRow = {
  courseId: string;
  title: string;
  category: string;
  grossRevenue: number;
  refundedRevenue: number;
  netRevenue: number;
  enrollments: number;
  completions: number;
  completionRate: number | null;
  refundRate: number | null;
  supportInquiryCount: number;
  profitabilityProxy: number;
  highRefundRate: boolean;
  adminHref: string;
};

export type FinanceSummary = {
  grossRevenue: number;
  netRevenue: number;
  refundedRevenue: number;
  refundRate: number | null;
  averageRevenuePerActiveLearner: number | null;
  paidEnrollments: number;
  manualEnrollments: number;
  activeLearners: number;
  supportInquiries: number;
  completionRate: number | null;
};

export type FinanceSections = {
  kpis: readonly ExecutiveMetricValue[];
  financeSummary: FinanceSummary;
  courseBusinessPerformance: ExecutiveTableModel<FinanceCoursePerformanceRow>;
  selectedCourseDetail: FinanceCoursePerformanceRow | null;
};

export type OpportunityQualityIssueType =
  | "expired"
  | "broken_link"
  | "missing_metadata"
  | "high_save_low_apply";

export type OpportunityQualityQueueRow = {
  id: string;
  opportunityId: string;
  title: string;
  issueType: OpportunityQualityIssueType;
  severity: "critical" | "high" | "medium" | "low";
  savedCount: number;
  applyClicks: number;
  applyRate: number | null;
  missingFields: readonly string[];
  lastCheckedAt: string | null;
  recommendedAction: string;
  state: ExecutiveSectionState;
};

export type OpportunityQualitySummary = {
  cleanupItems: number;
  expired: number;
  brokenLinks: number;
  missingMetadata: number;
  highSaveLowApply: number;
  state: ExecutiveSectionState;
};

export type AiSearchTrendPoint = {
  date: string;
  searches: number;
  zeroResultSearches: number;
  errorSearches: number;
};

export type AiUsageRow = {
  userId: string | null;
  searches: number;
  zeroResultSearches: number;
  errorSearches: number;
  estimatedCost: number;
  averageLatencyMs: number | null;
  state: ExecutiveSectionState;
};

export type AiQualitySummary = {
  totalSearches: number | null;
  zeroResultRate: number | null;
  errorRate: number | null;
  averageLatencyMs: number | null;
  estimatedCost: number | null;
  feedbackCount: number | null;
  state: ExecutiveSectionState;
};

export type AiQualitySignal = {
  id: string;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  value: number | null;
  message: string;
  state: ExecutiveSectionState;
};

export type RegisteredEventRow = {
  eventId: string;
  title: string;
  registrations: number;
  /** null means attendance tracking was not instrumented for this event. */
  attendees: number | null;
  /**
   * "ready" when attendanceTracked is true, "data_gap" otherwise.
   * This must never be shown as 0 when tracking is absent.
   */
  attendanceState: "ready" | "data_gap";
  /** null when attendanceTracked is false. */
  noShowRate: number | null;
  /** null when postEventSignups is not tracked. */
  postEventSignupConversionRate: number | null;
  /** null when postEventEnrollments is not tracked. */
  postEventEnrollmentConversionRate: number | null;
};

export type RegisteredEventsSummary = {
  totalRegistrations: number;
  uniqueEventsWithRegistrations: number;
  state: ExecutiveSectionState;
};

export type OpportunitiesAiSections = {
  kpis: readonly ExecutiveMetricValue[];
  aiQualitySummary: AiQualitySummary;
  aiSearchTrend: ExecutiveChartModel<AiSearchTrendPoint>;
  aiUsageByUser: ExecutiveTableModel<AiUsageRow>;
  aiQualitySignals: readonly AiQualitySignal[];
  opportunityQualitySummary: OpportunityQualitySummary;
  opportunityCleanupQueue: ExecutiveTableModel<OpportunityQualityQueueRow>;
  registeredEventsSummary: RegisteredEventsSummary;
  registeredEventsTable: ExecutiveTableModel<RegisteredEventRow>;
};

export type OpportunitiesAiReadModel =
  ExecutivePageResponse<OpportunitiesAiSections>;

export type TechnicalFreshnessRow = {
  sectionId: string;
  sourceKey: string;
  status: ExecutiveFreshnessStatus;
  lastSuccessfulAt: string | null;
  lastAttemptedAt: string;
  lastErrorCode: string | null;
  lastQueryDurationMs: number | null;
  rollingP95DurationMs: number | null;
  state: ExecutiveSectionState;
};

export type TechnicalPipelineHealth = {
  progressEvents: number;
  emailQueued: number;
  emailFailed: number;
  openActionItems: number;
  state: ExecutiveSectionState;
};

export type TechnicalAuditRow = {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
};

export type TechnicalPlatformUsage = {
  activeSessions: number;
  activeUsers: number;
  progressEvents: number;
  state: ExecutiveSectionState;
};

export type TechnicalSecuritySignals = {
  bannedUsers: number;
  unverifiedUsers: number;
  state: ExecutiveSectionState;
};

export type TechnicalEmailProviderState = {
  provider: string;
  state: string;
  failureCount: number;
  successCount: number;
  cooldownUntil: string | null;
  updatedAt: string;
};

export type TechnicalEmailHealth = {
  queued: number;
  accepted: number;
  failed: number;
  providers: readonly TechnicalEmailProviderState[];
  state: ExecutiveSectionState;
};

export type TechnicalQueryLatencyPoint = {
  sectionId: string;
  lastQueryDurationMs: number | null;
  rollingP95DurationMs: number | null;
};

export type TechnicalHealthSections = {
  freshnessGrid: ExecutiveTableModel<TechnicalFreshnessRow>;
  pipelineHealth: TechnicalPipelineHealth;
  adminAuditLog: ExecutiveTableModel<TechnicalAuditRow>;
  platformUsage: TechnicalPlatformUsage;
  securitySignals: TechnicalSecuritySignals;
  emailPipelineHealth: TechnicalEmailHealth;
  queryLatency: ExecutiveChartModel<TechnicalQueryLatencyPoint>;
};

export type TechnicalHealthReadModel =
  ExecutivePageResponse<TechnicalHealthSections>;

export type GrowthFunnelPoint = {
  id: string;
  label: string;
  value: number | null;
  rate: number | null;
  dropOffFromPrevious: number | null;
  state: ExecutiveSectionState;
};

export type GrowthCohortRetentionPoint = {
  cohort: string;
  users: number;
  retainedUsers: number;
  retentionRate: number | null;
};

export type WebsiteAnalyticsPoint = {
  label: string;
  value: number;
  rate: number | null;
};

export type WebsiteCtaPoint = {
  ctaId: string;
  label: string;
  clicks: number;
  clickRate: number | null;
};

export type WebsiteAnalyticsSummary = {
  visits: number | null;
  ctaClicks: number | null;
  signupStarts: number | null;
  signupConversionRate: number | null;
  state: ExecutiveSectionState;
};

export type PublicImpactAuditEntry = {
  action: string;
  actorId: string;
  at: string;
  fromStatus: PublicImpactStatus | null;
  toStatus: PublicImpactStatus;
  reason: string | null;
  originalComputedValue: number | null;
  manualOverrideValue: number | null;
};

export type PublicImpactMetricGovernanceRow = {
  metricId: string;
  label: string;
  value: number;
  computedValue: number;
  manualOverrideValue: number | null;
  sourceDescription: string;
  ownerId: string;
  approvalStatus: PublicImpactStatus;
  proposedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  auditTrail: readonly PublicImpactAuditEntry[];
  autoPublish: boolean;
  freshnessAt: string;
  updatedAt: string;
  state: ExecutiveSectionState;
};

export type PublicGrowthSections = {
  growthFunnel: ExecutiveChartModel<GrowthFunnelPoint>;
  websiteFunnel: ExecutiveChartModel<GrowthFunnelPoint>;
  websiteAnalyticsSummary: WebsiteAnalyticsSummary;
  trafficSources: ExecutiveChartModel<WebsiteAnalyticsPoint>;
  deviceBreakdown: ExecutiveChartModel<WebsiteAnalyticsPoint>;
  campaignPerformance: ExecutiveChartModel<WebsiteAnalyticsPoint>;
  ctaPerformance: ExecutiveChartModel<WebsiteCtaPoint>;
  studentReadiness: readonly ExecutiveMetricValue[];
  cohortRetention: ExecutiveChartModel<GrowthCohortRetentionPoint>;
  publicImpactMetrics: readonly PublicImpactMetricGovernanceRow[];
};

export type PublicGrowthReadModel =
  ExecutivePageResponse<PublicGrowthSections>;

export type InquiryPipelineStatusPoint = {
  status: string;
  value: number;
  rate: number | null;
};

export type InquiryPipelineRow = {
  inquiryId: string;
  courseId: string;
  courseTitle: string;
  status: string;
  assignedOwnerId: string | null;
  sourceChannel: string;
  submittedAt: string;
  hoursSinceSubmission: number;
  nextFollowUpDueAt: string;
  isSlaBreached: boolean;
  severity: "critical" | "high" | "medium" | "low";
  state: ExecutiveSectionState;
};

export type SalesSupportWorkloadRow = {
  ownerId: string | null;
  assignedInquiryCount: number;
  overdueFollowUpCount: number;
  averageResponseHours: number | null;
  resolvedCount: number;
  conversionRate: number | null;
  state: ExecutiveSectionState;
};

export type InquiryPipelineSummary = {
  totalInquiries: number;
  openInquiries: number;
  slaBreaches: number;
  overdueFollowUps: number;
  conversionRate: number | null;
  state: ExecutiveSectionState;
};

export type TeamOperationsSections = {
  inquiryPipelineSummary: InquiryPipelineSummary;
  inquiryStatusFunnel: ExecutiveChartModel<InquiryPipelineStatusPoint>;
  inquiryPipeline: ExecutiveTableModel<InquiryPipelineRow>;
  salesSupportWorkload: ExecutiveTableModel<SalesSupportWorkloadRow>;
};

export type TeamOperationsReadModel =
  ExecutivePageResponse<TeamOperationsSections>;
export type FinanceReadModel = ExecutivePageResponse<FinanceSections>;

export interface ExecutiveReadRepository {
  getOverview(query: ExecutivePageQuery): Promise<OverviewReadModel>;
  getUsers(query: ExecutivePageQuery): Promise<UsersReadModel>;
  getCoursesLessons(query: ExecutivePageQuery): Promise<CoursesLessonsReadModel>;
  getLessonDrilldown(
    query: ExecutivePageQuery,
    courseId: string,
  ): Promise<LessonDrilldownReadModel>;
  getLearnerProgress(query: ExecutivePageQuery): Promise<LearnerProgressReadModel>;
  getOpportunitiesAi(query: ExecutivePageQuery): Promise<OpportunitiesAiReadModel>;
  getTechnicalHealth(query: ExecutivePageQuery): Promise<TechnicalHealthReadModel>;
  getPublicGrowth(query: ExecutivePageQuery): Promise<PublicGrowthReadModel>;
  getTeamOperations(query: ExecutivePageQuery): Promise<TeamOperationsReadModel>;
  getFinance(query: ExecutivePageQuery): Promise<FinanceReadModel>;
}
