import { AlertTriangle, Gauge } from "lucide-react";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { OverviewReadModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { MetricCard } from "@/components/executive/sections/metric-card";
import { SectionState } from "@/components/executive/sections/section-state";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { ExportButton } from "@/components/executive/sections/export-button";
import { AreaChart } from "@/components/executive/charts/area-chart";
import { FunnelChart } from "@/components/executive/charts/funnel-chart";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const metricPresentation = {
  "overview.gross_revenue": {
    label: "Gross revenue",
    format: "currency",
    favorableDirection: "up",
  },
  "overview.net_new_subscriptions": {
    label: "Net new subscriptions",
    format: "number",
    favorableDirection: "up",
  },
  "overview.active_courses": {
    label: "Active courses",
    format: "number",
    favorableDirection: "up",
  },
  "overview.completion_rate": {
    label: "Completion rate",
    format: "percent",
    favorableDirection: "up",
  },
} as const;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultQuery() {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 29);
  return {
    from: isoDate(from),
    to: isoDate(to),
    preset: "last_30_days",
  };
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function readOverview(searchParams: PageProps["searchParams"]): Promise<OverviewReadModel> {
  const params = (await searchParams) ?? {};
  const query = executivePageQuerySchema.parse({
    ...defaultQuery(),
    ...Object.fromEntries(
      Object.entries(params)
        .map(([key, value]) => [key, firstValue(value)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  });

  return createExecutiveDomain().repositories.read.getOverview(query);
}

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export default async function ExecutiveOverviewPage({ searchParams }: PageProps) {
  const overview = await readOverview(searchParams);

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <Gauge className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Business health overview
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            {overview.query.from} to {overview.query.to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton pageId="overview" query={overview.query} />
          <FreshnessBadge
            status={overview.sections.revenueTrend.state.freshness}
            lastSuccessfulAt={overview.sections.revenueTrend.state.lastSuccessfulAt}
          />
        </div>
      </header>

      <section
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        aria-label="Business health key metrics"
      >
        {overview.sections.kpis.map((kpi) => {
          const presentation =
            metricPresentation[
              kpi.definitionId as keyof typeof metricPresentation
            ];
          return (
            <MetricCard
              key={kpi.definitionId}
              label={presentation?.label ?? kpi.definitionId}
              value={kpi.value}
              format={presentation?.format ?? "number"}
              deltaPercent={kpi.deltaPercent}
              favorableDirection={presentation?.favorableDirection ?? "neutral"}
              state={kpi.state}
            />
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <SectionState state={overview.sections.revenueTrend.state} title="Revenue trend">
          <AreaChart chart={overview.sections.revenueTrend} valueFormatter={currency} />
        </SectionState>
        <SectionState state={overview.sections.subscriptionFunnel.state} title="Subscription funnel">
          <FunnelChart chart={overview.sections.subscriptionFunnel} />
        </SectionState>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
        <SectionState state={overview.sections.completionTrend.state} title="Completion trend">
          <AreaChart chart={overview.sections.completionTrend} />
        </SectionState>
        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="overview-risks"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="overview-risks" className="text-sm font-semibold text-slate-950">
              Risk indicators
            </h2>
            <span className="text-xs font-medium uppercase text-slate-400">
              {overview.sections.riskIndicators.length} open
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {overview.sections.riskIndicators.length === 0 ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                No business-health risks detected for this range.
              </p>
            ) : (
              overview.sections.riskIndicators.map((risk) => (
                <div
                  key={risk.id}
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-700" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-950">{risk.label}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{risk.message}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
