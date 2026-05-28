import { ANALYTICS_EVENTS } from "./constants";
import type { AnalyticsEventName } from "./types";

const MIRRORED_EVENTS = new Set<AnalyticsEventName>([
  ANALYTICS_EVENTS.WEBSITE_VISIT,
  ANALYTICS_EVENTS.CTA_CLICK,
  ANALYTICS_EVENTS.SIGNUP_STARTED,
  ANALYTICS_EVENTS.SIGNUP_COMPLETED,
  ANALYTICS_EVENTS.AI_SEARCH,
  ANALYTICS_EVENTS.OPPORTUNITY_APPLY_CLICK,
]);

export function shouldMirrorEvent(event: AnalyticsEventName): boolean {
  return MIRRORED_EVENTS.has(event);
}

