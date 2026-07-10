import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { dbExecutiveAnalyticsEvents } from "@/db/schema/executive-analytics.schema";
import type { ExecutiveAnalyticsEventType } from "@/db/schema/executive-analytics.schema";
import type { WebsiteAnalyticsSnapshot } from "@/domain/executive/application/executive-dashboard.service";
import type { AiSearchAnalyticsSnapshot } from "@/domain/executive/application/executive-dashboard.service";

export type AnalyticsEventInput = {
  eventType: ExecutiveAnalyticsEventType;
  occurredAt: Date;
  userId?: string | null;
  sessionIdHash?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  deviceType?: string | null;
  metadata?: Record<string, unknown>;
};

export interface AnalyticsEventRepository {
  record(input: AnalyticsEventInput): Promise<string>;
}

type AnalyticsQueryClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select: (...args: unknown[]) => any;
};

export class DrizzleAnalyticsEventRepository implements AnalyticsEventRepository {
  async record(input: AnalyticsEventInput): Promise<string> {
    const rows = await db
      .insert(dbExecutiveAnalyticsEvents)
      .values({
        eventType: input.eventType,
        occurredAt: input.occurredAt,
        userId: input.userId ?? null,
        sessionIdHash: input.sessionIdHash ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        source: input.source ?? null,
        medium: input.medium ?? null,
        campaign: input.campaign ?? null,
        deviceType: input.deviceType ?? null,
        metadata: input.metadata ?? {},
      })
      .returning({ id: dbExecutiveAnalyticsEvents.id });
    return rows[0].id;
  }
}

function numeric(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return Number(value) || 0;
}

function fallbackLabel(value: string | null, fallback: string): string {
  return value?.trim() || fallback;
}

export async function getWebsiteAnalyticsSnapshot(
  from: Date,
  to: Date,
  database: AnalyticsQueryClient = db,
): Promise<WebsiteAnalyticsSnapshot> {
  const [trafficRows, deviceRows, campaignRows, ctaRows, ctaCountRows] =
    await Promise.all([
      database
        .select({
          label: dbExecutiveAnalyticsEvents.source,
          visits: count(),
        })
        .from(dbExecutiveAnalyticsEvents)
        .where(
          and(
            eq(dbExecutiveAnalyticsEvents.eventType, "website_visit"),
            gte(dbExecutiveAnalyticsEvents.occurredAt, from),
            lte(dbExecutiveAnalyticsEvents.occurredAt, to),
          ),
        )
        .groupBy(dbExecutiveAnalyticsEvents.source)
        .orderBy(desc(count()))
        .limit(10),
      database
        .select({
          label: dbExecutiveAnalyticsEvents.deviceType,
          visits: count(),
        })
        .from(dbExecutiveAnalyticsEvents)
        .where(
          and(
            eq(dbExecutiveAnalyticsEvents.eventType, "website_visit"),
            gte(dbExecutiveAnalyticsEvents.occurredAt, from),
            lte(dbExecutiveAnalyticsEvents.occurredAt, to),
          ),
        )
        .groupBy(dbExecutiveAnalyticsEvents.deviceType)
        .orderBy(desc(count()))
        .limit(10),
      database
        .select({
          label: dbExecutiveAnalyticsEvents.campaign,
          visits: count(),
        })
        .from(dbExecutiveAnalyticsEvents)
        .where(
          and(
            eq(dbExecutiveAnalyticsEvents.eventType, "website_visit"),
            gte(dbExecutiveAnalyticsEvents.occurredAt, from),
            lte(dbExecutiveAnalyticsEvents.occurredAt, to),
          ),
        )
        .groupBy(dbExecutiveAnalyticsEvents.campaign)
        .orderBy(desc(count()))
        .limit(10),
      database
        .select({
          ctaId: sql<string>`coalesce(nullif(${dbExecutiveAnalyticsEvents.metadata}->>'ctaId', ''), coalesce(${dbExecutiveAnalyticsEvents.entityId}, 'unknown'))`,
          label: sql<string>`coalesce(nullif(${dbExecutiveAnalyticsEvents.metadata}->>'label', ''), nullif(${dbExecutiveAnalyticsEvents.metadata}->>'ctaLabel', ''), coalesce(${dbExecutiveAnalyticsEvents.entityId}, 'Unknown CTA'))`,
          clicks: count(),
        })
        .from(dbExecutiveAnalyticsEvents)
        .where(
          and(
            eq(dbExecutiveAnalyticsEvents.eventType, "cta_click"),
            gte(dbExecutiveAnalyticsEvents.occurredAt, from),
            lte(dbExecutiveAnalyticsEvents.occurredAt, to),
          ),
        )
        .groupBy(
          sql`coalesce(nullif(${dbExecutiveAnalyticsEvents.metadata}->>'ctaId', ''), coalesce(${dbExecutiveAnalyticsEvents.entityId}, 'unknown'))`,
          sql`coalesce(nullif(${dbExecutiveAnalyticsEvents.metadata}->>'label', ''), nullif(${dbExecutiveAnalyticsEvents.metadata}->>'ctaLabel', ''), coalesce(${dbExecutiveAnalyticsEvents.entityId}, 'Unknown CTA'))`,
        )
        .orderBy(desc(count()))
        .limit(10),
      database
        .select({
          eventType: dbExecutiveAnalyticsEvents.eventType,
          value: count(),
        })
        .from(dbExecutiveAnalyticsEvents)
        .where(
          and(
            inArray(dbExecutiveAnalyticsEvents.eventType, ["cta_click"]),
            gte(dbExecutiveAnalyticsEvents.occurredAt, from),
            lte(dbExecutiveAnalyticsEvents.occurredAt, to),
          ),
        )
        .groupBy(dbExecutiveAnalyticsEvents.eventType),
    ]);

  return {
    trafficSources: trafficRows.map((row: { label: string | null; visits: unknown }) => ({
      label: fallbackLabel(row.label, "direct"),
      visits: numeric(row.visits),
    })),
    deviceBreakdown: deviceRows.map((row: { label: string | null; visits: unknown }) => ({
      label: fallbackLabel(row.label, "unknown"),
      visits: numeric(row.visits),
    })),
    campaignPerformance: campaignRows.map((row: { label: string | null; visits: unknown }) => ({
      label: fallbackLabel(row.label, "unattributed"),
      visits: numeric(row.visits),
    })),
    ctaPerformance: ctaRows.map((row: { ctaId: string; label: string; clicks: unknown }) => ({
      ctaId: row.ctaId,
      label: row.label,
      clicks: numeric(row.clicks),
    })),
    ctaClicks: ctaCountRows.length > 0 ? numeric(ctaCountRows[0]?.value) : null,
  };
}

export async function getAiSearchAnalyticsSnapshot(
  from: Date,
  to: Date,
): Promise<AiSearchAnalyticsSnapshot> {
  const resultCountInt = sql<number>`
    case
      when (${dbExecutiveAnalyticsEvents.metadata}->>'resultCount') ~ '^-?[0-9]+$'
        then (${dbExecutiveAnalyticsEvents.metadata}->>'resultCount')::numeric
      else null
    end
  `;
  const latencyNumeric = sql<number>`
    case
      when (${dbExecutiveAnalyticsEvents.metadata}->>'latencyMs') ~ '^-?[0-9]+(\\.[0-9]+)?$'
        then (${dbExecutiveAnalyticsEvents.metadata}->>'latencyMs')::numeric
      else null
    end
  `;
  const estimatedCostNumeric = sql<number>`
    case
      when (${dbExecutiveAnalyticsEvents.metadata}->>'estimatedCost') ~ '^-?[0-9]+(\\.[0-9]+)?$'
        then (${dbExecutiveAnalyticsEvents.metadata}->>'estimatedCost')::numeric
      else null
    end
  `;

  const [aggregateRows, trendRows, usageRows] = await Promise.all([
    db
      .select({
        eventType: dbExecutiveAnalyticsEvents.eventType,
        value: count(),
        zeroResults: sql<number>`coalesce(sum(case when coalesce(${resultCountInt}, -1) = 0 or ${dbExecutiveAnalyticsEvents.metadata}->>'zeroResults' = 'true' then 1 else 0 end), 0)`,
        errors: sql<number>`coalesce(sum(case when ${dbExecutiveAnalyticsEvents.metadata}->>'status' in ('error', 'failed') or ${dbExecutiveAnalyticsEvents.metadata}->>'ok' = 'false' then 1 else 0 end), 0)`,
        latency: sql<number>`avg(${latencyNumeric})`,
        estimatedCost: sql<number>`coalesce(sum(coalesce(${estimatedCostNumeric}, 0)), 0)`,
      })
      .from(dbExecutiveAnalyticsEvents)
      .where(
        and(
          inArray(dbExecutiveAnalyticsEvents.eventType, ["ai_search", "ai_feedback"]),
          gte(dbExecutiveAnalyticsEvents.occurredAt, from),
          lte(dbExecutiveAnalyticsEvents.occurredAt, to),
        ),
      )
      .groupBy(dbExecutiveAnalyticsEvents.eventType),
    db
      .select({
        date: sql<string>`date_trunc('day', ${dbExecutiveAnalyticsEvents.occurredAt})::date::text`,
        searches: count(),
        zeroResultSearches: sql<number>`coalesce(sum(case when coalesce(${resultCountInt}, -1) = 0 or ${dbExecutiveAnalyticsEvents.metadata}->>'zeroResults' = 'true' then 1 else 0 end), 0)`,
        errorSearches: sql<number>`coalesce(sum(case when ${dbExecutiveAnalyticsEvents.metadata}->>'status' in ('error', 'failed') or ${dbExecutiveAnalyticsEvents.metadata}->>'ok' = 'false' then 1 else 0 end), 0)`,
      })
      .from(dbExecutiveAnalyticsEvents)
      .where(
        and(
          eq(dbExecutiveAnalyticsEvents.eventType, "ai_search"),
          gte(dbExecutiveAnalyticsEvents.occurredAt, from),
          lte(dbExecutiveAnalyticsEvents.occurredAt, to),
        ),
      )
      .groupBy(sql`date_trunc('day', ${dbExecutiveAnalyticsEvents.occurredAt})::date`)
      .orderBy(sql`date_trunc('day', ${dbExecutiveAnalyticsEvents.occurredAt})::date asc`),
    db
      .select({
        userId: dbExecutiveAnalyticsEvents.userId,
        searches: count(),
        zeroResultSearches: sql<number>`coalesce(sum(case when coalesce(${resultCountInt}, -1) = 0 or ${dbExecutiveAnalyticsEvents.metadata}->>'zeroResults' = 'true' then 1 else 0 end), 0)`,
        errorSearches: sql<number>`coalesce(sum(case when ${dbExecutiveAnalyticsEvents.metadata}->>'status' in ('error', 'failed') or ${dbExecutiveAnalyticsEvents.metadata}->>'ok' = 'false' then 1 else 0 end), 0)`,
        averageLatencyMs: sql<number>`avg(${latencyNumeric})`,
        estimatedCost: sql<number>`coalesce(sum(coalesce(${estimatedCostNumeric}, 0)), 0)`,
      })
      .from(dbExecutiveAnalyticsEvents)
      .where(
        and(
          eq(dbExecutiveAnalyticsEvents.eventType, "ai_search"),
          gte(dbExecutiveAnalyticsEvents.occurredAt, from),
          lte(dbExecutiveAnalyticsEvents.occurredAt, to),
        ),
      )
      .groupBy(dbExecutiveAnalyticsEvents.userId)
      .orderBy(desc(count()))
      .limit(25),
  ]);

  const aiSearch = aggregateRows.find((row) => row.eventType === "ai_search");
  const feedback = aggregateRows.find((row) => row.eventType === "ai_feedback");
  if (!aiSearch) {
    return {
      totalSearches: null,
      zeroResultSearches: null,
      errorSearches: null,
      feedbackCount: feedback ? numeric(feedback.value) : null,
      estimatedCost: null,
      averageLatencyMs: null,
      trend: [],
      usageByUser: [],
    };
  }

  return {
    totalSearches: numeric(aiSearch.value),
    zeroResultSearches: numeric(aiSearch.zeroResults),
    errorSearches: numeric(aiSearch.errors),
    feedbackCount: feedback ? numeric(feedback.value) : 0,
    estimatedCost: numeric(aiSearch.estimatedCost),
    averageLatencyMs: aiSearch.latency === null ? null : numeric(aiSearch.latency),
    trend: trendRows.map((row) => ({
      date: row.date,
      searches: numeric(row.searches),
      zeroResultSearches: numeric(row.zeroResultSearches),
      errorSearches: numeric(row.errorSearches),
    })),
    usageByUser: usageRows.map((row) => ({
      userId: row.userId,
      searches: numeric(row.searches),
      zeroResultSearches: numeric(row.zeroResultSearches),
      errorSearches: numeric(row.errorSearches),
      estimatedCost: numeric(row.estimatedCost),
      averageLatencyMs: row.averageLatencyMs === null ? null : numeric(row.averageLatencyMs),
    })),
  };
}

export function createAnalyticsEventRepository(): AnalyticsEventRepository {
  return new DrizzleAnalyticsEventRepository();
}
