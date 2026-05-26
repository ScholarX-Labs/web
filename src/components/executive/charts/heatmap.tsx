import { cn } from "@/lib/utils";
import type { ExecutiveChartModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { ChartA11ySummary } from "./chart-a11y-summary";

export type HeatmapPoint = {
  dayOfWeek: number;
  hour: number;
  value: number;
};

export type HeatmapProps<TPoint extends HeatmapPoint> = {
  chart: ExecutiveChartModel<TPoint>;
  className?: string;
};

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function intensity(value: number, max: number): string {
  if (value <= 0) return "bg-slate-100";
  const ratio = value / Math.max(max, 1);
  if (ratio >= 0.75) return "bg-blue-700";
  if (ratio >= 0.5) return "bg-blue-500";
  if (ratio >= 0.25) return "bg-blue-300";
  return "bg-blue-100";
}

export function Heatmap<TPoint extends HeatmapPoint>({
  chart,
  className,
}: HeatmapProps<TPoint>) {
  const max = Math.max(...chart.points.map((point) => point.value), 1);
  const pointByBucket = new Map(
    chart.points.map((point) => [`${point.dayOfWeek}:${point.hour}`, point]),
  );

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
          {chart.state.status}
        </span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-[44px_repeat(24,minmax(20px,1fr))] gap-1">
          <div aria-hidden="true" />
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="text-center text-[10px] font-medium text-slate-400">
              {hour}
            </div>
          ))}
          {days.map((day, dayOfWeek) => (
            <div key={day} className="contents">
              <div className="flex items-center text-xs font-medium text-slate-500">
                {day}
              </div>
              {Array.from({ length: 24 }, (_, hour) => {
                const point = pointByBucket.get(`${dayOfWeek}:${hour}`);
                const value = point?.value ?? 0;
                return (
                  <div
                    key={`${day}-${hour}`}
                    className={cn("aspect-square rounded-sm", intensity(value, max))}
                    title={`${day} ${hour}:00 UTC: ${value.toLocaleString()} events`}
                    aria-label={`${day} ${hour}:00 UTC ${value.toLocaleString()} events`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <ChartA11ySummary
        title={`${chart.title} data summary`}
        summary={chart.a11ySummary}
        className="mt-4"
      />
    </section>
  );
}
