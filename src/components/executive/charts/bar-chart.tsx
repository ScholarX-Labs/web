import { cn } from "@/lib/utils";
import type { ExecutiveChartModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { ChartA11ySummary } from "./chart-a11y-summary";

export type BarChartPoint = {
  value: number;
  date?: string;
  role?: string;
  month?: string;
  label?: string;
};

export type BarChartProps<TPoint extends BarChartPoint> = {
  chart: ExecutiveChartModel<TPoint>;
  labelForPoint?: (point: TPoint) => string;
  className?: string;
};

function defaultLabel(point: BarChartPoint): string {
  return point.label ?? point.role ?? point.month ?? point.date ?? "";
}

export function BarChart<TPoint extends BarChartPoint>({
  chart,
  labelForPoint = defaultLabel,
  className,
}: BarChartProps<TPoint>) {
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
      <div className="mt-5 flex h-48 items-end gap-1.5 overflow-hidden">
        {chart.points.map((point, index) => {
          const height = `${Math.max(2, (point.value / max) * 100)}%`;
          const label = labelForPoint(point);
          return (
            <div
              key={`${label}-${index}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-40 w-full items-end rounded-t bg-slate-100">
                <div
                  className="w-full rounded-t bg-blue-600"
                  style={{ height }}
                  aria-hidden="true"
                />
              </div>
              <span className="w-full truncate text-center text-[10px] font-medium text-slate-500">
                {label}
              </span>
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
