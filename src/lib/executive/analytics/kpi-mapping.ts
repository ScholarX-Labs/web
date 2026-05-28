import { ANALYTICS_EVENTS } from "./constants";

export type KpiMetricId =
  | "growth.website_visits"
  | "growth.cta_clicks_total"
  | "growth.signup_starts"
  | "growth.signup_completions"
  | "growth.opportunity_actions";

export const KPI_EVENT_MAPPING: Readonly<Record<KpiMetricId, readonly string[]>> = {
  "growth.website_visits": [ANALYTICS_EVENTS.WEBSITE_VISIT],
  "growth.cta_clicks_total": [ANALYTICS_EVENTS.CTA_CLICK],
  "growth.signup_starts": [ANALYTICS_EVENTS.SIGNUP_STARTED],
  "growth.signup_completions": [ANALYTICS_EVENTS.SIGNUP_COMPLETED],
  "growth.opportunity_actions": ["opportunity_apply_click"],
};

export function getMappedMetricsForEvent(event: string): readonly KpiMetricId[] {
  return (Object.entries(KPI_EVENT_MAPPING) as [KpiMetricId, readonly string[]][])
    .filter(([, events]) => events.includes(event))
    .map(([metricId]) => metricId);
}
