import { randomUUID } from "node:crypto";
import type { EmailDeliveryRepository } from "../contracts/email-delivery.repository";
import type { EmailProvider } from "../contracts/email-provider";
import type {
  EmailLogger,
  EmailMetricsSink,
  EmailRateLimiter,
  ProviderCircuitBreaker,
  Clock,
} from "../contracts/email-infrastructure";
import type { EmailFallbackPolicy, EmailRetryPolicy } from "../contracts/email-policies";
import type {
  EmailDeliveryRecord,
  EmailFailureCategory,
  EmailProviderName,
  EmailServiceConfig,
  SendEmailRequest,
  SendEmailResponse,
} from "../contracts/email-types";
import { sendEmailRequestSchema } from "./email-delivery.schemas";
import {
  createRequestId,
  createSubjectPreview,
  hashEmailValue,
  hashSubject,
  maskEmailAddress,
  normalizeEmailAddress,
  safeFailureReason,
} from "./email-sanitization";

export type EmailDeliveryServiceDependencies = {
  config: EmailServiceConfig;
  repository: EmailDeliveryRepository;
  providers: EmailProvider[];
  retryPolicy: EmailRetryPolicy;
  fallbackPolicy: EmailFallbackPolicy;
  circuitBreaker: ProviderCircuitBreaker;
  rateLimiter: EmailRateLimiter;
  metrics: EmailMetricsSink;
  clock: Clock;
  logger: EmailLogger;
};

export class EmailDeliveryService {
  private readonly providers;

  constructor(private readonly deps: EmailDeliveryServiceDependencies) {
    this.providers = new Map(deps.providers.map((provider) => [provider.name, provider]));
  }

  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    const parsed = sendEmailRequestSchema.safeParse({
      ...request,
      requestId: request.requestId ?? createRequestId(request.category),
    });

    if (!parsed.success) {
      return {
        ok: false,
        deliveryId: "unpersisted",
        requestId: request.requestId ?? "invalid",
        status: "failed",
        failureCategory: "validation",
        message: "Invalid email request",
      };
    }

    const now = this.deps.clock.now();
    const normalizedRecipient = normalizeEmailAddress(parsed.data.to);
    const from = parsed.data.from ?? this.defaultFrom();
    const callerKey =
      parsed.data.requestedByUserId ??
      parsed.data.requestedBySystem ??
      parsed.data.category;

    const rateLimit = await this.deps.rateLimiter.checkAndIncrement({
      category: parsed.data.category,
      callerKey,
      recipientEmail: normalizedRecipient,
      now,
    });

    if (!rateLimit.allowed) {
      this.deps.metrics.increment("email_rate_limited_total", {
        category: parsed.data.category,
        scope: rateLimit.scope,
      });

      return {
        ok: false,
        deliveryId: "rate_limited",
        requestId: parsed.data.requestId ?? "rate_limited",
        status: "failed",
        failureCategory: "rate_limited",
        message: "Email rate limit exceeded",
        retryAfter: rateLimit.retryAfter.toISOString(),
      };
    }

    this.deps.metrics.increment("email_delivery_requested_total", {
      category: parsed.data.category,
    });

    const delivery = await this.deps.repository.createOrReuseDelivery({
      request: parsed.data,
      normalizedRecipient,
      from,
      recipientHash: hashEmailValue(normalizedRecipient),
      subjectHash: hashSubject(parsed.data.subject),
      subjectPreview: createSubjectPreview(parsed.data.subject),
      now,
    });

    if (delivery.status === "accepted" && delivery.acceptedProvider && delivery.acceptedAt) {
      return {
        ok: true,
        deliveryId: delivery.id,
        requestId: delivery.requestId,
        status: "accepted",
        provider: delivery.acceptedProvider,
        providerMessageId: delivery.providerMessageId ?? undefined,
        acceptedAt: delivery.acceptedAt.toISOString(),
      };
    }

    const claimed = await this.deps.repository.claimDeliveryForSending({
      deliveryId: delivery.id,
      workerId: `send:${randomUUID()}`,
      lockedUntil: new Date(now.getTime() + this.deps.config.workerLeaseSeconds * 1000),
      expectedStateVersion: delivery.stateVersion,
    });

    if (!claimed) {
      return {
        ok: false,
        deliveryId: delivery.id,
        requestId: delivery.requestId,
        status: "retry_scheduled",
        failureCategory: "provider_unavailable",
        message: "Email delivery is already being processed",
      };
    }

    return this.processClaimedDelivery(claimed);
  }

  async processClaimedDelivery(delivery: EmailDeliveryRecord): Promise<SendEmailResponse> {
    const providerOrder: EmailProviderName[] = ["primary"];
    let currentDelivery = delivery;
    let lastFailure: {
      failureCategory: EmailFailureCategory;
      safeReason: string;
      retryable: boolean;
      fallbackEligible: boolean;
    } = {
      failureCategory: "unknown",
      safeReason: "No provider attempt was made",
      retryable: true,
      fallbackEligible: false,
    };

    for (const providerName of providerOrder) {
      const result = await this.attemptProvider(currentDelivery, providerName);
      if (result.ok) return result.response;

      lastFailure = result.failure;
      currentDelivery = {
        ...currentDelivery,
        attemptCount: currentDelivery.attemptCount + 1,
      };
      const fallbackDecision = this.deps.fallbackPolicy.decide({
        delivery: currentDelivery,
        failedProvider: providerName,
        failureCategory: result.failure.failureCategory,
        retryable: result.failure.retryable,
        fallbackEligible: result.failure.fallbackEligible,
        circuitState: "closed",
      });

      if (fallbackDecision.action === "fallback") {
        this.deps.metrics.increment("email_delivery_fallback_attempted_total", {
          category: currentDelivery.category,
          reason: fallbackDecision.reason,
        });

        const fallback = await this.attemptProvider(currentDelivery, fallbackDecision.provider);
        if (fallback.ok) return fallback.response;
        lastFailure = fallback.failure;
        currentDelivery = {
          ...currentDelivery,
          attemptCount: currentDelivery.attemptCount + 1,
        };
      }
    }

    const latestAttempt = {
      id: "latest",
      deliveryId: currentDelivery.id,
      attemptNumber: currentDelivery.attemptCount,
      provider: "primary" as const,
      status: "failed" as const,
      startedAt: this.deps.clock.now(),
      finishedAt: this.deps.clock.now(),
      failureCategory: lastFailure.failureCategory,
      failureReason: lastFailure.safeReason,
    };
    const retryDecision = this.deps.retryPolicy.decide({
      delivery: currentDelivery,
      latestAttempt,
      now: this.deps.clock.now(),
    });

    if (retryDecision.action === "retry") {
      const scheduled = await this.deps.repository.scheduleRetry({
        deliveryId: currentDelivery.id,
        failureCategory: lastFailure.failureCategory,
        failureReason: retryDecision.reason,
        nextAttemptAt: retryDecision.nextAttemptAt,
        now: this.deps.clock.now(),
      });
      this.deps.metrics.increment("email_delivery_retry_scheduled_total", {
        category: scheduled.category,
        retryDepth: String(scheduled.attemptCount),
      });

      return {
        ok: false,
        deliveryId: scheduled.id,
        requestId: scheduled.requestId,
        status: "retry_scheduled",
        failureCategory: lastFailure.failureCategory,
        message: retryDecision.reason,
        retryAfter: retryDecision.nextAttemptAt.toISOString(),
      };
    }

    const failed = await this.deps.repository.markFailed({
      deliveryId: currentDelivery.id,
      failureCategory: lastFailure.failureCategory,
      failureReason: retryDecision.reason,
      failedAt: this.deps.clock.now(),
    });
    this.deps.metrics.increment("email_delivery_failed_total", {
      category: failed.category,
      provider: failed.acceptedProvider ?? "none",
      failureCategory: lastFailure.failureCategory,
    });

    return {
      ok: false,
      deliveryId: failed.id,
      requestId: failed.requestId,
      status: "failed",
      failureCategory: lastFailure.failureCategory,
      message: retryDecision.reason,
    };
  }

  private async attemptProvider(delivery: EmailDeliveryRecord, providerName: EmailProviderName) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return {
        ok: false as const,
        failure: {
          failureCategory: "configuration" as const,
          safeReason: `${providerName} provider is not configured`,
          retryable: false,
          fallbackEligible: providerName === "primary",
        },
      };
    }

    const now = this.deps.clock.now();
    const circuit = await this.deps.circuitBreaker.beforeAttempt(providerName, now);
    if (!circuit.allowed) {
      return {
        ok: false as const,
        failure: {
          failureCategory: "provider_unavailable" as const,
          safeReason: `${providerName} circuit is open`,
          retryable: true,
          fallbackEligible: providerName === "primary",
        },
      };
    }

    const attemptNumber = delivery.attemptCount + 1;
    const startedAt = this.deps.clock.now();
    const attempt = await this.deps.repository.createAttempt({
      deliveryId: delivery.id,
      attemptNumber,
      provider: providerName,
      startedAt,
    });

    const providerResult = await provider.send({
      to: delivery.recipientEmail,
      from: delivery.senderIdentity,
      replyTo: delivery.replyTo ?? undefined,
      subject: delivery.subjectPreview ?? "ScholarX notification",
      text: delivery.text ?? "",
      html: delivery.html ?? undefined,
    });
    const finishedAt = this.deps.clock.now();
    const latencyMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());

    this.deps.metrics.observe("email_provider_latency_ms", latencyMs, {
      provider: providerName,
      outcome: providerResult.accepted ? "accepted" : "failed",
    });

    if (providerResult.accepted) {
      await this.deps.circuitBreaker.recordSuccess(providerName, finishedAt);
      const accepted = await this.deps.repository.finishAttemptAndMarkAccepted({
        attemptId: attempt.id,
        deliveryId: delivery.id,
        status: "accepted",
        provider: providerName,
        finishedAt,
        providerMessageId: providerResult.providerMessageId,
        latencyMs,
        acceptedAt: providerResult.rawAcceptedAt,
      });

      this.deps.metrics.increment("email_delivery_accepted_total", {
        category: accepted.category,
        provider: providerName,
      });
      this.deps.metrics.observe(
        "email_delivery_end_to_end_latency_ms",
        Math.max(0, finishedAt.getTime() - accepted.createdAt.getTime()),
        { category: accepted.category, finalStatus: "accepted" },
      );

      return {
        ok: true as const,
        response: {
          ok: true as const,
          deliveryId: accepted.id,
          requestId: accepted.requestId,
          status: "accepted" as const,
          provider: providerName,
          providerMessageId: providerResult.providerMessageId,
          acceptedAt: providerResult.rawAcceptedAt.toISOString(),
        },
      };
    }

    await this.deps.circuitBreaker.recordFailure({
      provider: providerName,
      failureCategory: providerResult.failureCategory,
      now: finishedAt,
    });
    await this.deps.repository.finishAttempt({
      attemptId: attempt.id,
      status: providerResult.failureCategory === "timeout" ? "timed_out" : "failed",
      finishedAt,
      failureCategory: providerResult.failureCategory,
      failureReason: safeFailureReason(providerResult.safeReason),
      latencyMs,
    });

    this.deps.logger.warn("Email provider attempt failed", {
      deliveryId: delivery.id,
      provider: providerName,
      recipient: maskEmailAddress(delivery.recipientEmail),
      failureCategory: providerResult.failureCategory,
    });

    return {
      ok: false as const,
      failure: providerResult,
    };
  }

  private defaultFrom(): string {
    const primary = this.deps.config.providers.find((provider) => provider.name === "primary");
    if (!primary) throw new Error("Primary email provider is not configured");
    return primary.from;
  }
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class ConsoleEmailLogger implements EmailLogger {
  info(message: string, context?: Record<string, string | number | boolean | null>): void {
    console.info(message, context);
  }

  warn(message: string, context?: Record<string, string | number | boolean | null>): void {
    console.warn(message, context);
  }

  error(message: string, context?: Record<string, string | number | boolean | null>): void {
    console.error(message, context);
  }
}
