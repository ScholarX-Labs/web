import type {
  ExecutiveChartType,
  ExecutiveMetricSensitivity,
} from "../contracts/executive-types";

export type MetricFormat = "number" | "currency" | "percent" | "duration";
export type FavorableDirection = "up" | "down" | "neutral";

export type MetricDefinition = {
  id: string;
  label: string;
  description: string;
  calculation: string;
  format: MetricFormat;
  favorableDirection: FavorableDirection;
  sensitivity: ExecutiveMetricSensitivity;
  preferredChartType?: ExecutiveChartType;
};

const coreDefinitions = [
  {
    id: "overview.gross_revenue",
    label: "Gross revenue",
    description: "Total subscription revenue in the selected period before refunds.",
    calculation: "SUM(subscriptions.amount) for paid subscriptions in range.",
    format: "currency",
    favorableDirection: "up",
    sensitivity: "restricted",
    preferredChartType: "line",
  },
  {
    id: "overview.net_new_subscriptions",
    label: "Net new subscriptions",
    description: "New subscriptions minus cancelled and refunded subscriptions.",
    calculation: "new - cancelled - refunded for the selected period.",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "overview.active_courses",
    label: "Active courses",
    description: "Published or active courses available during the selected period.",
    calculation: "COUNT(courses) where status is active or published.",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "overview.completion_rate",
    label: "Completion rate",
    description: "Course completions divided by new subscriptions in the selected period.",
    calculation: "completed course progress rows / subscriptions in range.",
    format: "percent",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "line",
  },
  {
    id: "users.active_users",
    label: "Active users",
    description: "Users with at least one progress sync event in the selected period.",
    calculation: "COUNT(DISTINCT progress_sync_events.user_id).",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "line",
  },
  {
    id: "users.new_users",
    label: "New users",
    description: "Users created in the selected period.",
    calculation: "COUNT(auth.user) where created_at is in range.",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "line",
  },
  {
    id: "users.verified_email_rate",
    label: "Verified email rate",
    description: "Share of users with verified email addresses.",
    calculation: "verified user count / total user count.",
    format: "percent",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "users.banned_users",
    label: "Banned users",
    description: "Users currently marked as banned.",
    calculation: "COUNT(auth.user) where banned = true.",
    format: "number",
    favorableDirection: "down",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "technical.freshness_current_ratio",
    label: "Current sections",
    description: "Percentage of dashboard sections with current data.",
    calculation: "current sections / all tracked sections.",
    format: "percent",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "courses.total_courses",
    label: "Total courses",
    description: "Courses matching the selected filters.",
    calculation: "COUNT(courses.courses) after course filters.",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "courses.active_courses",
    label: "Active courses",
    description: "Courses with active or published status.",
    calculation: "COUNT(courses.courses) where status in active/published.",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "courses.total_enrollments",
    label: "Enrollments",
    description: "Subscriptions created in the selected range.",
    calculation: "COUNT(courses.subscriptions) in range.",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "courses.completion_rate",
    label: "Completion rate",
    description: "Course completions divided by enrollments in the selected range.",
    calculation: "completed course progress rows / subscriptions in range.",
    format: "percent",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "growth.signup_conversion_rate",
    label: "Signup conversion",
    description: "Signups divided by website visits when website instrumentation exists.",
    calculation: "signup count / website visit count.",
    format: "percent",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "funnel",
  },
  {
    id: "growth.enrollment_conversion_rate",
    label: "Enrollment conversion",
    description: "Enrollments divided by signups in the selected period.",
    calculation: "subscription count / signup count.",
    format: "percent",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "funnel",
  },
  {
    id: "opportunities.cleanup_items",
    label: "Cleanup items",
    description: "Opportunity quality issues requiring review.",
    calculation: "Count of opportunity quality queue rows in the selected period.",
    format: "number",
    favorableDirection: "down",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "opportunities.broken_links",
    label: "Broken links",
    description: "Opportunities whose latest link check reported a broken destination.",
    calculation: "Count of opportunity link-check events with broken status.",
    format: "number",
    favorableDirection: "down",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "opportunities.expired",
    label: "Expired opportunities",
    description: "Opportunities marked expired by quality instrumentation.",
    calculation: "Count of opportunity quality records flagged as expired.",
    format: "number",
    favorableDirection: "down",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "opportunities.high_save_low_apply",
    label: "Saved, not applying",
    description: "Saved opportunities with very low apply-click follow-through.",
    calculation: "Saved opportunities above threshold with apply-click rate below threshold.",
    format: "number",
    favorableDirection: "down",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "ai.total_searches",
    label: "AI searches",
    description: "Total AI opportunity searches in the selected period.",
    calculation: "COUNT(ai_search analytics events).",
    format: "number",
    favorableDirection: "up",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "ai.zero_result_rate",
    label: "Zero-result rate",
    description: "Share of AI searches that returned no opportunity results.",
    calculation: "zero-result AI searches / total AI searches.",
    format: "percent",
    favorableDirection: "down",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "ai.error_rate",
    label: "AI error rate",
    description: "Share of AI searches that failed or returned an error status.",
    calculation: "failed AI searches / total AI searches.",
    format: "percent",
    favorableDirection: "down",
    sensitivity: "admin_only",
    preferredChartType: "bar",
  },
  {
    id: "ai.estimated_cost",
    label: "Estimated cost",
    description: "Estimated AI search cost reported by instrumentation.",
    calculation: "SUM(metadata.estimatedCost) for AI search events.",
    format: "currency",
    favorableDirection: "down",
    sensitivity: "restricted",
    preferredChartType: "bar",
  },
] as const satisfies readonly MetricDefinition[];

export class MetricDefinitionRegistry {
  private readonly definitions: ReadonlyMap<string, MetricDefinition>;

  constructor(definitions: readonly MetricDefinition[] = coreDefinitions) {
    this.definitions = new Map(definitions.map((definition) => [definition.id, definition]));
  }

  getRequired(id: string): MetricDefinition {
    const definition = this.definitions.get(id);
    if (!definition) {
      throw new Error(`Unknown metric definition: ${id}`);
    }
    return definition;
  }

  find(id: string): MetricDefinition | null {
    return this.definitions.get(id) ?? null;
  }

  list(): readonly MetricDefinition[] {
    return Array.from(this.definitions.values());
  }
}

export function createMetricDefinitionRegistry(): MetricDefinitionRegistry {
  return new MetricDefinitionRegistry();
}
