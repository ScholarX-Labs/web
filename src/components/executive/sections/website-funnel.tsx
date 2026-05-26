import type {
  ExecutiveChartModel,
  WebsiteAnalyticsPoint,
  WebsiteCtaPoint,
} from "@/domain/executive/contracts/executive-read-repository.contract";

export type WebsiteFunnelProps = {
  trafficSources: ExecutiveChartModel<WebsiteAnalyticsPoint>;
  deviceBreakdown: ExecutiveChartModel<WebsiteAnalyticsPoint>;
  campaignPerformance: ExecutiveChartModel<WebsiteAnalyticsPoint>;
  ctaPerformance: ExecutiveChartModel<WebsiteCtaPoint>;
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

function DistributionList({
  title,
  rows,
}: {
  title: string;
  rows: readonly { label: string; value: number; rate: number | null }[];
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
      <h3 className="text-xs font-semibold uppercase text-slate-500">{title}</h3>
      <div className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No instrumentation available.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-slate-700">{row.label}</span>
              <span className="shrink-0 text-slate-500">
                {row.value.toLocaleString()} {row.rate === null ? "" : `(${percent.format(row.rate)})`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function WebsiteFunnel({
  trafficSources,
  deviceBreakdown,
  campaignPerformance,
  ctaPerformance,
}: WebsiteFunnelProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="website-analytics"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="website-analytics" className="text-sm font-semibold text-slate-950">
          Website analytics
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {trafficSources.state.status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <DistributionList title={trafficSources.title} rows={trafficSources.points} />
        <DistributionList title={deviceBreakdown.title} rows={deviceBreakdown.points} />
        <DistributionList title={campaignPerformance.title} rows={campaignPerformance.points} />
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase text-slate-500">
            {ctaPerformance.title}
          </h3>
          <div className="mt-3 space-y-2">
            {ctaPerformance.points.length === 0 ? (
              <p className="text-sm text-slate-500">No CTA events available.</p>
            ) : (
              ctaPerformance.points.map((row) => (
                <div key={row.ctaId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-slate-700">{row.label}</span>
                  <span className="shrink-0 text-slate-500">
                    {row.clicks.toLocaleString()} {row.clickRate === null ? "" : `(${percent.format(row.clickRate)})`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
