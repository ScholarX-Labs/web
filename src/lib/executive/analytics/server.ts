import { sanitizeAnalyticsProperties } from "./privacy";
import { recordAnalyticsEvent } from "@/lib/executive/record-analytics-event";
import type { AnalyticsEventInput } from "./types";
import type { ExecutiveAnalyticsEventType } from "@/db/schema/executive-analytics.schema";

type MirroredAnalyticsEventInput = Omit<AnalyticsEventInput, "event"> & {
  event: ExecutiveAnalyticsEventType;
};

export async function trackServerEvent(
  input: MirroredAnalyticsEventInput,
): Promise<void> {
  const properties = sanitizeAnalyticsProperties(input.properties);
  await recordAnalyticsEvent({
    eventType: input.event,
    source: "server",
    metadata: properties,
  });
}
