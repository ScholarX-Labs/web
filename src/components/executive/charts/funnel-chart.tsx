import { cn } from "@/lib/utils";
import type { ExecutiveChartModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { ChartA11ySummary } from "./chart-a11y-summary";

export type FunnelChartPoint = {
  label: string;
  value: number;
  rate: number | null;
};

export type FunnelChartProps<TPoint extends FunnelChartPoint> = {
  chart: ExecutiveChartModel<TPoint>;
  className?: string;
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function FunnelChart<TPoint extends FunnelChartPoint>({
  chart,
  className,
}: FunnelChartProps<TPoint>) {
  const max = Math.max(...chart.points.map((point) => point.value), 1);

  return (
    <section
      className={cn("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)}
      aria-labelledby={`${chart.id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id={`${chart.id}-title`} className="text-sm font-semibold text-slate-950">
          {chart.title}
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {chart.state.freshness}
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {chart.points.map((point) => {
          const width = `${Math.max(8, (point.value / max) * 100)}%`;
          return (
            <div key={point.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">{point.label}</span>
                <span className="font-semibold text-slate-950">
                  {point.value.toLocaleString()}
                  {point.rate === null ? "" : ` (${percent.format(point.rate)})`}
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-blue-600"
                  style={{ width }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
      <ChartA11ySummary
        title={`${chart.title} data summary`}
        summary={chart.a11ySummary}
        className="mt-4"
      />
    </section>
  );
}
