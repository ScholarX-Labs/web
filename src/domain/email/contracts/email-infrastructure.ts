import type {
  EmailCategory,
  EmailFailureCategory,
  EmailProviderName,
  ProviderCircuitStateName,
} from "./email-types";

export interface Clock {
  now(): Date;
}

export interface EmailLogger {
  info(message: string, context?: Record<string, string | number | boolean | null>): void;
  warn(message: string, context?: Record<string, string | number | boolean | null>): void;
  error(message: string, context?: Record<string, string | number | boolean | null>): void;
}

export interface ProviderCircuitBreaker {
  beforeAttempt(
    provider: EmailProviderName,
    now: Date,
  ): Promise<
    | { allowed: true; state: Exclude<ProviderCircuitStateName, "open"> }
    | { allowed: false; state: "open"; retryAfter: Date }
  >;
  recordSuccess(provider: EmailProviderName, now: Date): Promise<void>;
  recordFailure(input: {
    provider: EmailProviderName;
    failureCategory: EmailFailureCategory;
    now: Date;
  }): Promise<void>;
}

export interface EmailRateLimiter {
  checkAndIncrement(input: {
    category: EmailCategory;
    callerKey: string;
    recipientEmail: string;
    now: Date;
  }): Promise<
    | { allowed: true }
    | {
        allowed: false;
        retryAfter: Date;
        scope: "caller" | "category" | "recipient" | "caller_category";
      }
  >;
}

export type EmailCounterMetric =
  | "email_delivery_requested_total"
  | "email_delivery_accepted_total"
  | "email_delivery_failed_total"
  | "email_delivery_fallback_attempted_total"
  | "email_delivery_retry_scheduled_total"
  | "email_delivery_bounced_total"
  | "email_delivery_complained_total"
  | "email_provider_circuit_open_total"
  | "email_rate_limited_total";

export type EmailHistogramMetric =
  | "email_provider_latency_ms"
  | "email_delivery_end_to_end_latency_ms"
  | "email_worker_batch_duration_ms"
  | "email_retry_depth";

export interface EmailMetricsSink {
  increment(metric: EmailCounterMetric, labels: Record<string, string>): void;
  observe(
    metric: EmailHistogramMetric,
    value: number,
    labels: Record<string, string>,
  ): void;
}
