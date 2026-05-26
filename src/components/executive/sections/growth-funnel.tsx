import type { ExecutiveChartModel, GrowthFunnelPoint } from "@/domain/executive/contracts/executive-read-repository.contract";
import { FunnelChart } from "@/components/executive/charts/funnel-chart";

export type GrowthFunnelProps = {
  chart: ExecutiveChartModel<GrowthFunnelPoint>;
};

export function GrowthFunnel({ chart }: GrowthFunnelProps) {
  return (
    <FunnelChart
      chart={{
        ...chart,
        points: chart.points.map((point) => ({
          label: point.label,
          value: point.value ?? 0,
          rate: point.rate,
        })),
      }}
    />
  );
}
