import { z } from "zod";
import { ANALYTICS_EVENTS } from "./constants";

export const analyticsEventsRouteInputSchema = z.object({
  event: z.enum([
    ANALYTICS_EVENTS.WEBSITE_VISIT,
    ANALYTICS_EVENTS.CTA_CLICK,
    ANALYTICS_EVENTS.SIGNUP_STARTED,
    ANALYTICS_EVENTS.SIGNUP_COMPLETED,
    ANALYTICS_EVENTS.AI_SEARCH,
    ANALYTICS_EVENTS.OPPORTUNITY_APPLY_CLICK,
  ]),
  properties: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export type AnalyticsEventsRouteInput = z.infer<typeof analyticsEventsRouteInputSchema>;
