import type { EmailFallbackPolicy, EmailRetryPolicy } from "../contracts/email-policies";
import type { EmailServiceConfig } from "../contracts/email-types";

export class DefaultEmailRetryPolicy implements EmailRetryPolicy {
  constructor(private readonly config: Pick<EmailServiceConfig, "maxAttempts" | "retryDelaySeconds">) {}

  decide(input: Parameters<EmailRetryPolicy["decide"]>[0]) {
    if (input.delivery.attemptCount >= this.config.maxAttempts) {
      return { action: "fail" as const, reason: "max_attempts_exhausted" };
    }

    return {
      action: "retry" as const,
      nextAttemptAt: new Date(input.now.getTime() + this.config.retryDelaySeconds * 1000),
      reason: "retryable_provider_failure",
    };
  }
}

export class DefaultEmailFallbackPolicy implements EmailFallbackPolicy {
  constructor(private readonly fallbackEnabled: boolean) {}

  decide(input: Parameters<EmailFallbackPolicy["decide"]>[0]) {
    if (!this.fallbackEnabled) {
      return { action: "skip" as const, reason: "fallback_disabled" };
    }

    if (input.failedProvider !== "primary") {
      return { action: "skip" as const, reason: "fallback_already_attempted" };
    }

    if (!input.retryable || !input.fallbackEligible) {
      return { action: "skip" as const, reason: "failure_not_fallback_eligible" };
    }

    if (input.circuitState === "open") {
      return { action: "skip" as const, reason: "fallback_circuit_open" };
    }

    return {
      action: "fallback" as const,
      provider: "gmail_fallback" as const,
      reason: "primary_retryable_failure",
    };
  }
}
