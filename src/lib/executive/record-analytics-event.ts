import { createExecutiveDomain } from "@/domain/executive";
import type { ExecutiveAnalyticsEventType } from "@/db/schema/executive-analytics.schema";
import { getMappedMetricsForEvent } from "@/lib/executive/analytics/kpi-mapping";

type RecordAnalyticsEventInput = {
  eventType: ExecutiveAnalyticsEventType;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  deviceType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAnalyticsEvent(
  input: RecordAnalyticsEventInput,
): Promise<void> {
  try {
    const mappedMetricIds = getMappedMetricsForEvent(input.eventType);
    const metadata: Record<string, unknown> = { ...(input.metadata ?? {}) };
    if (mappedMetricIds.length > 0) {
      metadata.mappedMetricIds = mappedMetricIds;
    }

    await createExecutiveDomain().repositories.analyticsEvents.record({
      eventType: input.eventType,
      occurredAt: new Date(),
      source: input.source ?? null,
      medium: input.medium ?? null,
      campaign: input.campaign ?? null,
      deviceType: input.deviceType ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata,
    });
  } catch (error) {
    console.warn("recordAnalyticsEvent: non-blocking write failure", error);
  }
}
