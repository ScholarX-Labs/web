import { DollarSign } from "lucide-react";
import { createExecutiveDomain } from "@/domain/executive";
import { executivePageQuerySchema } from "@/domain/executive/contracts/executive-query.schemas";
import type { FinanceReadModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { FreshnessBadge } from "@/components/executive/sections/freshness-badge";
import { ExportButton } from "@/components/executive/sections/export-button";
import { MetricCard } from "@/components/executive/sections/metric-card";
import { CourseBusinessPerformanceTable } from "@/components/executive/tables/course-business-performance-table";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const metricPresentation = {
  "finance.gross_revenue": { label: "Gross revenue", format: "currency", favorableDirection: "up" },
  "finance.net_revenue": { label: "Net revenue", format: "currency", favorableDirection: "up" },
  "finance.refund_rate": { label: "Refund rate", format: "percent", favorableDirection: "down" },
  "finance.avg_revenue_per_active_learner": { label: "ARPA", format: "currency", favorableDirection: "up" },
  "finance.paid_enrollments": { label: "Paid enrollments", format: "number", favorableDirection: "up" },
  "finance.manual_enrollments": { label: "Manual enrollments", format: "number", favorableDirection: "neutral" },
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

async function readFinance(searchParams: PageProps["searchParams"]): Promise<FinanceReadModel> {
  const params = (await searchParams) ?? {};
  const query = executivePageQuerySchema.parse({
    ...defaultQuery(),
    ...Object.fromEntries(
      Object.entries(params)
        .map(([key, value]) => [key, firstValue(value)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    ),
  });

  return createExecutiveDomain().repositories.read.getFinance(query);
}

export default async function FinancePage({ searchParams }: PageProps) {
  const finance = await readFinance(searchParams);
  const selected = finance.sections.selectedCourseDetail;

  return (
    <main className="space-y-6 pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-blue-700">
            <DollarSign className="size-4" aria-hidden="true" />
            Executive dashboard
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            Finance and unit economics
          </h1>
          <p className="max-w-3xl text-sm text-slate-500">
            {finance.query.from} to {finance.query.to}
            {finance.query.courseId ? ` · Course: ${finance.query.courseId}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton pageId="finance" query={finance.query} />
          <FreshnessBadge
            status={finance.sections.courseBusinessPerformance.state.freshness}
            lastSuccessfulAt={finance.sections.courseBusinessPerformance.state.lastSuccessfulAt}
          />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Finance metrics">
        {finance.sections.kpis.map((metric) => {
          const presentation = metricPresentation[metric.definitionId as keyof typeof metricPresentation];
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

      {selected ? (
        <section
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          aria-labelledby="selected-finance-course"
        >
          <h2 id="selected-finance-course" className="text-sm font-semibold text-slate-950">
            Selected course
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {selected.title} · {selected.category}
          </p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Gross revenue</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                {selected.grossRevenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Net revenue</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                {selected.netRevenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Refund rate</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                {selected.refundRate === null ? "-" : selected.refundRate.toLocaleString("en-US", { style: "percent", maximumFractionDigits: 1 })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-400">Profitability proxy</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">
                {selected.profitabilityProxy.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      <CourseBusinessPerformanceTable rows={finance.sections.courseBusinessPerformance.rows} />
    </main>
  );
}
