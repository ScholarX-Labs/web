import { ANALYTICS_EVENTS } from "./constants";

export type AnalyticsEventOwner = "growth" | "product" | "data-platform";
export type AnalyticsIngestionSurface = "client_route" | "client_direct";
export type AnalyticsPiiClass = "none" | "low";

export type AnalyticsEventContract = {
  event: (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
  owner: AnalyticsEventOwner;
  description: string;
  schemaVersion: number;
  ingestion: AnalyticsIngestionSurface;
  mirrorEligible: boolean;
  piiClass: AnalyticsPiiClass;
};

export const ANALYTICS_EVENT_REGISTRY: readonly AnalyticsEventContract[] = [
  {
    event: ANALYTICS_EVENTS.WEBSITE_VISIT,
    owner: "growth",
    description: "Public website visit for top-of-funnel growth measurement.",
    schemaVersion: 1,
    ingestion: "client_route",
    mirrorEligible: true,
    piiClass: "none",
  },
  {
    event: ANALYTICS_EVENTS.CTA_CLICK,
    owner: "growth",
    description: "Public CTA interaction used for conversion funnel tracking.",
    schemaVersion: 1,
    ingestion: "client_route",
    mirrorEligible: true,
    piiClass: "none",
  },
  {
    event: ANALYTICS_EVENTS.SIGNUP_STARTED,
    owner: "growth",
    description: "Signup flow start event for funnel drop-off analysis.",
    schemaVersion: 1,
    ingestion: "client_route",
    mirrorEligible: true,
    piiClass: "none",
  },
  {
    event: ANALYTICS_EVENTS.SIGNUP_COMPLETED,
    owner: "growth",
    description: "Signup flow completion event for conversion tracking.",
    schemaVersion: 1,
    ingestion: "client_route",
    mirrorEligible: true,
    piiClass: "none",
  },
  {
    event: ANALYTICS_EVENTS.AI_SEARCH,
    owner: "product",
    description: "AI search behavior signal for quality and reliability KPIs.",
    schemaVersion: 1,
    ingestion: "client_route",
    mirrorEligible: true,
    piiClass: "none",
  },
  {
    event: ANALYTICS_EVENTS.OPPORTUNITY_APPLY_CLICK,
    owner: "product",
    description: "Opportunity apply-click intent signal.",
    schemaVersion: 1,
    ingestion: "client_route",
    mirrorEligible: true,
    piiClass: "none",
  },
  {
    event: ANALYTICS_EVENTS.OPPORTUNITY_VIEW,
    owner: "product",
    description: "Opportunity view impression signal.",
    schemaVersion: 1,
    ingestion: "client_direct",
    mirrorEligible: false,
    piiClass: "none",
  },
  {
    event: ANALYTICS_EVENTS.OPPORTUNITY_SAVE,
    owner: "product",
    description: "Opportunity save intent signal.",
    schemaVersion: 1,
    ingestion: "client_direct",
    mirrorEligible: false,
    piiClass: "none",
  },
] as const;

export function getAnalyticsEventContract(event: string): AnalyticsEventContract | null {
  return ANALYTICS_EVENT_REGISTRY.find((entry) => entry.event === event) ?? null;
}
