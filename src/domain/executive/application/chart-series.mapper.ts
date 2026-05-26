import type {
  ExecutiveChartModel,
} from "../contracts/executive-read-repository.contract";
import type { ExecutiveChartType, ExecutiveSectionState } from "../contracts/executive-types";

export type ChartPoint = Record<string, number | string | null>;

export class ChartSeriesMapper {
  toChart<TPoint extends ChartPoint>(input: {
    id: string;
    title: string;
    chartType: ExecutiveChartType;
    points: readonly TPoint[];
    a11ySummary: string;
    state: ExecutiveSectionState;
    isZoomed?: boolean;
  }): ExecutiveChartModel<TPoint> {
    return {
      id: input.id,
      title: input.title,
      chartType: input.chartType,
      points: input.points,
      a11ySummary: input.a11ySummary,
      state: input.state,
      isZoomed: input.isZoomed ?? false,
    };
  }
}

export function createChartSeriesMapper(): ChartSeriesMapper {
  return new ChartSeriesMapper();
}
