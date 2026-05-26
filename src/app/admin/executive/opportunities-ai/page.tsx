import { Sparkles } from "lucide-react";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { OpportunitiesAiReadModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { MetricCard } from "@/components/executive/sections/metric-card";
import { AiQualitySection } from "@/components/executive/sections/ai-quality-section";
import { AiUsageTable } from "@/components/executive/tables/ai-usage-table";
import { OpportunityCleanupTable } from "@/components/executive/tables/opportunity-cleanup-table";
import { EventImpactTable } from "@/components/executive/tables/event-impact-table";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const metricPresentation = {
  "ai.total_searches": {
    label: "AI searches",
    format: "number",
    favorableDirection: "up",
  },
  "ai.zero_result_rate": {
    label: "Zero-result rate",
    format: "percent",
    favorableDirection: "down",
  },
  "ai.error_rate": {
    label: "AI error rate",
    format: "percent",
    favorableDirection: "down",
  },
  "ai.estimated_cost": {
    label: "Estimated cost",
    format: "currency",
    favorableDirection: "down",
  },
  "opportunities.cleanup_items": {
    label: "Cleanup items",
    format: "number",
    favorableDirection: "down",
  },
  "opportunities.broken_links": {
    label: "Broken links",
    format: "number",
    favorableDirection: "down",
  },
  "opportunities.expired": {
    label: "Expired",
    format: "number",
    favorableDirection: "down",
  },
  "opportunities.high_save_low_apply": {
    label: "Saved, low apply",
    format: "number",
    favorableDirection: "down",
  },
} as const;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultQuery() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 29);
  return { from: isoDate(from), to: isoDate(to), preset: "last_30_days" };
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readOpportunitiesAi(
  searchParams: PageProps["searchParams"],
): Promise<OpportunitiesAiReadModel> {
  const params = (await searchParams) ?? {};
  const query = executivePageQuerySchema.parse({
    ...defaultQuery(),
    ...Object.fromEntries(
      Object.entries(params)
        .map(([key, value]) => [key, firstValue(value)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  });

  return createExecutiveDomain().repositories.read.getOpportunitiesAi(query);
}

export default async function OpportunitiesAiPage({ searchParams }: PageProps) {
  const opportunities = await readOpportunitiesAi(searchParams);

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <Sparkles className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Opportunities & AI
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            {opportunities.query.from} to {opportunities.query.to}
          </p>
        </div>
        <FreshnessBadge
          status={opportunities.sections.opportunityCleanupQueue.state.freshness}
          lastSuccessfulAt={opportunities.sections.opportunityCleanupQueue.state.lastSuccessfulAt}
        />
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Opportunity and AI metrics">
        {opportunities.sections.kpis.map((metric) => {
          const presentation =
            metricPresentation[metric.definitionId as keyof typeof metricPresentation];
          return (
            <MetricCard
              key={metric.definitionId}
              label={presentation?.label ?? metric.definitionId}
              value={metric.value}
              format={presentation?.format ?? "number"}
              deltaPercent={metric.deltaPercent}
              favorableDirection={presentation?.favorableDirection ?? "neutral"}
              state={metric.state}
            />
          );
        })}
      </section>

      <AiQualitySection
        summary={opportunities.sections.aiQualitySummary}
        trend={opportunities.sections.aiSearchTrend}
        signals={opportunities.sections.aiQualitySignals}
      />

      <AiUsageTable rows={opportunities.sections.aiUsageByUser.rows} />

      <OpportunityCleanupTable rows={opportunities.sections.opportunityCleanupQueue.rows} />

      {opportunities.sections.registeredEventsSummary.state.status !== "data_gap" ? (
        <EventImpactTable
          rows={opportunities.sections.registeredEventsTable.rows}
          totalRegistrations={opportunities.sections.registeredEventsSummary.totalRegistrations}
        />
      ) : (
        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="registered-events-unavailable"
        >
          <h2
            id="registered-events-unavailable"
            className="text-sm font-semibold text-slate-950"
          >
            Registered events
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {opportunities.sections.registeredEventsSummary.state.message ??
              "Event registration data is not yet available for this period."}
          </p>
        </section>
      )}
    </main>
  );
}
