import type {
  EmailCounterMetric,
  EmailHistogramMetric,
  EmailMetricsSink,
} from "../contracts/email-infrastructure";

export class ConsoleEmailMetricsSink implements EmailMetricsSink {
  increment(metric: EmailCounterMetric, labels: Record<string, string>): void {
    console.info("[email metric]", { metric, labels, value: 1 });
  }

  observe(
    metric: EmailHistogramMetric,
    value: number,
    labels: Record<string, string>,
  ): void {
    console.info("[email metric]", { metric, labels, value });
  }
}

export class NoopEmailMetricsSink implements EmailMetricsSink {
  increment(): void {}
  observe(): void {}
}
