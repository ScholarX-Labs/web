import type { ANALYTICS_EVENTS } from "./constants";

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

export type AnalyticsEventInput = {
  event: AnalyticsEventName;
  properties?: AnalyticsProperties;
};

