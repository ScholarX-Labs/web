import type {
  AiQualitySignal,
  AiQualitySummary,
  ExecutiveChartModel,
  AiSearchTrendPoint,
} from "@/domain/executive/contracts/executive-read-repository.contract";

export type AiQualitySectionProps = {
  summary: AiQualitySummary;
  trend: ExecutiveChartModel<AiSearchTrendPoint>;
  signals: readonly AiQualitySignal[];
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const severityTone = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  medium: "border-blue-200 bg-blue-50 text-blue-700",
  low: "border-slate-200 bg-slate-50 text-slate-600",
} as const satisfies Record<AiQualitySignal["severity"], string>;

export function AiQualitySection({ summary, trend, signals }: AiQualitySectionProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="ai-quality"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="ai-quality" className="text-sm font-semibold text-slate-950">
          AI search quality
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {summary.state.status}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Searches</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {summary.totalSearches === null ? "-" : summary.totalSearches.toLocaleString()}
          </p>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Zero results</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {summary.zeroResultRate === null ? "-" : percent.format(summary.zeroResultRate)}
          </p>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Errors</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {summary.errorRate === null ? "-" : percent.format(summary.errorRate)}
          </p>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Latency</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {summary.averageLatencyMs === null ? "-" : `${Math.round(summary.averageLatencyMs).toLocaleString()}ms`}
          </p>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Cost</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {summary.estimatedCost === null ? "-" : currency.format(summary.estimatedCost)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase text-slate-500">{trend.title}</h3>
          <div className="mt-3 space-y-2">
            {trend.points.length === 0 ? (
              <p className="text-sm text-slate-500">No AI trend points available.</p>
            ) : (
              trend.points.map((point) => (
                <div key={point.date} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-600">{point.date}</span>
                  <span className="font-medium text-slate-950">
                    {point.searches.toLocaleString()} searches
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
          <h3 className="text-xs font-semibold uppercase text-slate-500">Quality flags</h3>
          <div className="mt-3 space-y-2">
            {signals.length === 0 ? (
              <p className="text-sm text-slate-500">No AI quality flags.</p>
            ) : (
              signals.map((signal) => (
                <div key={signal.id} className={`rounded border px-3 py-2 ${severityTone[signal.severity]}`}>
                  <p className="text-sm font-semibold">{signal.label}</p>
                  <p className="mt-1 text-xs">{signal.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
