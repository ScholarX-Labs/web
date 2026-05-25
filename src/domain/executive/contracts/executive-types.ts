export const executivePageIds = [
  "overview",
  "users",
  "courses_lessons",
  "learner_progress",
  "opportunities_ai",
  "technical_health",
  "action_center",
  "public_growth",
  "team_operations",
  "finance",
] as const;

export type ExecutivePageId = (typeof executivePageIds)[number];

export const phaseOneExecutivePageIds = [
  "overview",
  "users",
  "courses_lessons",
  "learner_progress",
  "opportunities_ai",
  "technical_health",
  "action_center",
  "public_growth",
] as const satisfies readonly ExecutivePageId[];

export type PhaseOneExecutivePageId =
  (typeof phaseOneExecutivePageIds)[number];

export const executiveSectionStatuses = [
  "ready",
  "empty",
  "data_gap",
  "stale",
  "partial",
  "error",
  "access_denied",
] as const;

export type ExecutiveSectionStatus =
  (typeof executiveSectionStatuses)[number];

export const executiveFreshnessStatuses = [
  "current",
  "stale",
  "very_stale",
  "unavailable",
] as const;

export type ExecutiveFreshnessStatus =
  (typeof executiveFreshnessStatuses)[number];

export const executiveChartTypes = [
  "line",
  "area",
  "bar",
  "stacked_bar",
  "horizontal_bar",
  "donut",
  "funnel",
  "heatmap",
  "waterfall",
] as const;

export type ExecutiveChartType = (typeof executiveChartTypes)[number];

export const executiveActionSeverities = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export type ExecutiveActionSeverity =
  (typeof executiveActionSeverities)[number];

export const executiveActionStatuses = [
  "open",
  "in_progress",
  "resolved",
  "dismissed",
  "escalated",
] as const;

export type ExecutiveActionStatus = (typeof executiveActionStatuses)[number];

export const publicImpactStatuses = [
  "draft",
  "pending_review",
  "approved",
  "published",
  "rejected",
  "expired",
  "manual_override",
] as const;

export type PublicImpactStatus = (typeof publicImpactStatuses)[number];

export const executiveMetricSensitivityLevels = [
  "public_safe",
  "admin_only",
  "executive_only",
  "restricted",
] as const;

export type ExecutiveMetricSensitivity =
  (typeof executiveMetricSensitivityLevels)[number];

export type ExecutiveSectionState = {
  status: ExecutiveSectionStatus;
  freshness: ExecutiveFreshnessStatus;
  lastSuccessfulAt: string | null;
  message?: string;
  source?: string;
};
