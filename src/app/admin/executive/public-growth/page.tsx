import { Globe2 } from "lucide-react";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { PublicGrowthReadModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { ExportButton } from "@/components/executive/sections/export-button";
import { MetricCard } from "@/components/executive/sections/metric-card";
import { GrowthFunnel } from "@/components/executive/sections/growth-funnel";
import { WebsiteFunnel } from "@/components/executive/sections/website-funnel";
import { PublicImpactMetricsTable } from "@/components/executive/tables/public-impact-metrics-table";
import { BarChart } from "@/components/executive/charts/bar-chart";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const metricPresentation = {
  "growth.signup_conversion_rate": {
    label: "Signup conversion",
    format: "percent",
    favorableDirection: "up",
  },
  "growth.enrollment_conversion_rate": {
    label: "Enrollment conversion",
    format: "percent",
    favorableDirection: "up",
  },
} as const;
type MetricPresentationKey = keyof typeof metricPresentation;

function isMetricPresentationKey(id: string): id is MetricPresentationKey {
  return id in metricPresentation;
}

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

async function readPublicGrowth(
  searchParams: PageProps["searchParams"],
): Promise<PublicGrowthReadModel> {
  const params = (await searchParams) ?? {};
  const query = executivePageQuerySchema.parse({
    ...defaultQuery(),
    ...Object.fromEntries(
      Object.entries(params)
        .map(([key, value]) => [key, firstValue(value)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  });

  return createExecutiveDomain().repositories.read.getPublicGrowth(query);
}

export default async function PublicGrowthPage({ searchParams }: PageProps) {
  const growth = await readPublicGrowth(searchParams);

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <Globe2 className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Public Website & Growth
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            {growth.query.from} to {growth.query.to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton pageId="public_growth" query={growth.query} />
          <FreshnessBadge
            status={growth.sections.growthFunnel.state.freshness}
            lastSuccessfulAt={growth.sections.growthFunnel.state.lastSuccessfulAt}
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Growth conversion metrics">
        {growth.sections.studentReadiness.map((metric) => {
          const presentation = isMetricPresentationKey(metric.definitionId)
            ? metricPresentation[metric.definitionId]
            : undefined;
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

      <section className="grid gap-4 xl:grid-cols-2">
        <GrowthFunnel chart={growth.sections.growthFunnel} />
        <GrowthFunnel chart={growth.sections.websiteFunnel} />
      </section>

      <WebsiteFunnel
        trafficSources={growth.sections.trafficSources}
        deviceBreakdown={growth.sections.deviceBreakdown}
        campaignPerformance={growth.sections.campaignPerformance}
        ctaPerformance={growth.sections.ctaPerformance}
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <BarChart
          chart={{
            ...growth.sections.cohortRetention,
            points: growth.sections.cohortRetention.points.map((point) => ({
              label: point.cohort,
              value: point.retentionRate ?? 0,
            })),
          }}
          labelForPoint={(point) => point.label}
        />
        <PublicImpactMetricsTable metrics={growth.sections.publicImpactMetrics} />
      </section>
    </main>
  );
}
