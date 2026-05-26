import type { ExecutiveSectionState } from "../contracts/executive-types";

export type TimeAxisResolution = "daily" | "weekly" | "monthly";

export type DateRange = {
  from: Date;
  to: Date;
};

export type PriorPeriod = {
  from: Date;
  to: Date;
};

const MS_PER_DAY = 86_400_000;

export class MetricCalculationPolicy {
  getTimeAxisResolution(range: DateRange): TimeAxisResolution {
    const days = this.getInclusiveDayCount(range);
    if (days <= 30) return "daily";
    if (days <= 90) return "weekly";
    return "monthly";
  }

  getInclusiveDayCount(range: DateRange): number {
    const start = Date.UTC(
      range.from.getUTCFullYear(),
      range.from.getUTCMonth(),
      range.from.getUTCDate(),
    );
    const end = Date.UTC(
      range.to.getUTCFullYear(),
      range.to.getUTCMonth(),
      range.to.getUTCDate(),
    );
    return Math.max(1, Math.floor((end - start) / MS_PER_DAY) + 1);
  }

  getPriorPeriod(range: DateRange): PriorPeriod {
    const days = this.getInclusiveDayCount(range);
    const priorTo = new Date(range.from.getTime() - MS_PER_DAY);
    const priorFrom = new Date(priorTo.getTime() - (days - 1) * MS_PER_DAY);
    return { from: priorFrom, to: priorTo };
  }

  calculateRate(numerator: number, denominator: number): number | null {
    if (denominator <= 0) return null;
    return numerator / denominator;
  }

  calculateDelta(
    current: number | null,
    previous: number | null,
  ): { deltaValue: number | null; deltaPercent: number | null } {
    if (current === null || previous === null) {
      return { deltaValue: null, deltaPercent: null };
    }
    const deltaValue = current - previous;
    const deltaPercent = previous === 0 ? null : deltaValue / previous;
    return { deltaValue, deltaPercent };
  }

  classifyValueState(value: number | string | null, sourceSucceeded: boolean): ExecutiveSectionState {
    if (!sourceSucceeded) {
      return {
        status: "data_gap",
        freshness: "unavailable",
        lastSuccessfulAt: null,
      };
    }

    return {
      status: value === 0 ? "empty" : "ready",
      freshness: "current",
      lastSuccessfulAt: new Date().toISOString(),
    };
  }
}

export function createMetricCalculationPolicy(): MetricCalculationPolicy {
  return new MetricCalculationPolicy();
}
