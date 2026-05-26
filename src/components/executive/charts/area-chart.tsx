import { cn } from "@/lib/utils";
import type { ExecutiveChartModel } from "@/domain/executive/contracts/executive-read-repository.contract";
import { ChartA11ySummary } from "./chart-a11y-summary";

export type AreaChartPoint = {
  date: string;
  value: number;
};

export type AreaChartProps<TPoint extends AreaChartPoint> = {
  chart: ExecutiveChartModel<TPoint>;
  valueFormatter?: (value: number) => string;
  className?: string;
};

function buildPath(points: readonly AreaChartPoint[], width: number, height: number) {
  if (points.length === 0) return "";
  const max = Math.max(...points.map((point) => point.value), 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : index * step;
      const y = height - (point.value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function AreaChart<TPoint extends AreaChartPoint>({
  chart,
  valueFormatter = (value) => new Intl.NumberFormat("en-US").format(value),
  className,
}: AreaChartProps<TPoint>) {
  const width = 640;
  const height = 180;
  const linePath = buildPath(chart.points, width, height);
  const areaPath = linePath
    ? `${linePath} L ${width} ${height} L 0 ${height} Z`
    : "";
  const latest = chart.points.at(-1)?.value ?? 0;

  return (
    <section
      className={cn("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)}
      aria-labelledby={`${chart.id}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`${chart.id}-title`} className="text-sm font-semibold text-slate-950">
            {chart.title}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Latest: {valueFormatter(latest)}
          </p>
        </div>
        <span className="text-xs font-medium uppercase text-slate-400">
          {chart.state.freshness}
        </span>
      </div>
      <div className="mt-5 aspect-[16/6] w-full min-w-0">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={chart.a11ySummary}
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <path d={areaPath} fill="rgb(37 99 235 / 0.12)" />
          <path
            d={linePath}
            fill="none"
            stroke="rgb(37 99 235)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      </div>
      <ChartA11ySummary
        title={`${chart.title} data summary`}
        summary={chart.a11ySummary}
        className="mt-4"
      />
    </section>
  );
}
