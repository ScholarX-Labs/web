import type {
  EmailDeliveryAttemptRecord,
  EmailDeliveryRecord,
  EmailFailureCategory,
  EmailProviderName,
  ProviderCircuitStateName,
} from "./email-types";

export type RetryDecision =
  | { action: "retry"; nextAttemptAt: Date; reason: string }
  | { action: "fail"; reason: string };

export interface EmailRetryPolicy {
  decide(input: {
    delivery: EmailDeliveryRecord;
    latestAttempt: EmailDeliveryAttemptRecord;
    now: Date;
  }): RetryDecision;
}

export type FallbackDecision =
  | { action: "fallback"; provider: "gmail_fallback"; reason: string }
  | { action: "skip"; reason: string };

export interface EmailFallbackPolicy {
  decide(input: {
    delivery: EmailDeliveryRecord;
    failedProvider: EmailProviderName;
    failureCategory: EmailFailureCategory;
    retryable: boolean;
    fallbackEligible: boolean;
    circuitState: ProviderCircuitStateName;
  }): FallbackDecision;
}
