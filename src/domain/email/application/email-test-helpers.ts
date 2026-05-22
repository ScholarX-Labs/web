import { randomUUID } from "node:crypto";
import type { EmailDeliveryRepository } from "../contracts/email-delivery.repository";
import type { EmailProvider } from "../contracts/email-provider";
import type {
  Clock,
  EmailLogger,
  EmailMetricsSink,
  EmailRateLimiter,
  ProviderCircuitBreaker,
} from "../contracts/email-infrastructure";
import type {
  AppendDeliveryEventInput,
  CreateAttemptInput,
  CreateDeliveryInput,
  EmailDeliveryAttemptRecord,
  EmailDeliveryDetail,
  EmailDeliveryEventRecord,
  EmailDeliveryRecord,
  EmailProviderName,
  EmailProviderRequest,
  EmailProviderResult,
  FinishAttemptAndMarkAcceptedInput,
  FinishAttemptInput,
  MarkFailedInput,
  ScheduleRetryInput,
} from "../contracts/email-types";

export class FakeEmailProvider implements EmailProvider {
  sent: EmailProviderRequest[] = [];

  constructor(
    readonly name: EmailProviderName,
    private readonly results: EmailProviderResult[],
  ) {}

  async send(request: EmailProviderRequest): Promise<EmailProviderResult> {
    this.sent.push(request);
    return (
      this.results.shift() ?? {
        accepted: true,
        providerMessageId: `${this.name}-message`,
        rawAcceptedAt: new Date("2026-05-22T00:00:00.000Z"),
      }
    );
  }

  async checkHealth(): Promise<"healthy"> {
    return "healthy";
  }
}

export class FixedClock implements Clock {
  constructor(private current = new Date("2026-05-22T00:00:00.000Z")) {}

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class MemoryMetricsSink implements EmailMetricsSink {
  counters: Array<{ metric: string; labels: Record<string, string> }> = [];
  observations: Array<{ metric: string; value: number; labels: Record<string, string> }> = [];

  increment(metric: never, labels: Record<string, string>): void {
    this.counters.push({ metric, labels });
  }

  observe(metric: never, value: number, labels: Record<string, string>): void {
    this.observations.push({ metric, value, labels });
  }
}

export class NoopLogger implements EmailLogger {
  info(): void {}
  warn(): void {}
  error(): void {}
}

export class AllowAllRateLimiter implements EmailRateLimiter {
  async checkAndIncrement(): Promise<{ allowed: true }> {
    return { allowed: true };
  }
}

export class AllowAllCircuitBreaker implements ProviderCircuitBreaker {
  async beforeAttempt(): Promise<{ allowed: true; state: "closed" }> {
    return { allowed: true, state: "closed" };
  }

  async recordSuccess(): Promise<void> {}
  async recordFailure(): Promise<void> {}
}

export class InMemoryEmailDeliveryRepository implements EmailDeliveryRepository {
  deliveries = new Map<string, EmailDeliveryRecord>();
  attempts = new Map<string, EmailDeliveryAttemptRecord>();
  events = new Map<string, EmailDeliveryEventRecord>();

  async createOrReuseDelivery(input: CreateDeliveryInput): Promise<EmailDeliveryRecord> {
    const existing = [...this.deliveries.values()].find(
      (delivery) =>
        delivery.category === input.request.category &&
        delivery.idempotencyKey === input.request.idempotencyKey,
    );
    if (existing) return existing;

    const delivery: EmailDeliveryRecord = {
      id: randomUUID(),
      requestId: input.request.requestId ?? randomUUID(),
      idempotencyKey: input.request.idempotencyKey,
      category: input.request.category,
      status: "queued",
      recipientEmail: input.normalizedRecipient,
      recipientHash: input.recipientHash,
      senderIdentity: input.from,
      subjectHash: input.subjectHash,
      subjectPreview: input.subjectPreview,
      bodyStorageMode: "stored",
      bodyReference: null,
      text: input.request.text,
      html: input.request.html ?? null,
      replyTo: input.request.replyTo ?? null,
      acceptedProvider: null,
      providerMessageId: null,
      failureCategory: null,
      failureReason: null,
      requestedByUserId: input.request.requestedByUserId ?? null,
      requestedBySystem: input.request.requestedBySystem ?? null,
      metadata: input.request.metadata ?? {},
      nextAttemptAt: null,
      attemptCount: 0,
      lockedBy: null,
      lockedAt: null,
      lockedUntil: null,
      stateVersion: 0,
      batchId: null,
      createdAt: input.now,
      updatedAt: input.now,
      acceptedAt: null,
      failedAt: null,
    };
    this.deliveries.set(delivery.id, delivery);
    return delivery;
  }

  async claimDeliveryForSending(input: {
    deliveryId: string;
    workerId: string;
    lockedUntil: Date;
    expectedStateVersion?: number;
  }): Promise<EmailDeliveryRecord | null> {
    const delivery = this.deliveries.get(input.deliveryId);
    if (!delivery) return null;
    if (
      input.expectedStateVersion !== undefined &&
      delivery.stateVersion !== input.expectedStateVersion
    ) {
      return null;
    }
    if (!["queued", "retry_scheduled", "sending"].includes(delivery.status)) return null;

    const updated = {
      ...delivery,
      status: "sending" as const,
      lockedBy: input.workerId,
      lockedAt: new Date(),
      lockedUntil: input.lockedUntil,
      stateVersion: delivery.stateVersion + 1,
    };
    this.deliveries.set(updated.id, updated);
    return updated;
  }

  async claimRetryableBatch(input: {
    workerId: string;
    lockedUntil: Date;
    limit: number;
    now: Date;
  }): Promise<EmailDeliveryRecord[]> {
    const candidates = [...this.deliveries.values()]
      .filter((delivery) =>
        ["queued", "retry_scheduled"].includes(delivery.status) &&
        (!delivery.nextAttemptAt || delivery.nextAttemptAt <= input.now),
      )
      .slice(0, input.limit);

    const claimed: EmailDeliveryRecord[] = [];
    for (const delivery of candidates) {
      const row = await this.claimDeliveryForSending({
        deliveryId: delivery.id,
        workerId: input.workerId,
        lockedUntil: input.lockedUntil,
        expectedStateVersion: delivery.stateVersion,
      });
      if (row) claimed.push(row);
    }
    return claimed;
  }

  async createAttempt(input: CreateAttemptInput): Promise<EmailDeliveryAttemptRecord> {
    const attempt: EmailDeliveryAttemptRecord = {
      id: randomUUID(),
      deliveryId: input.deliveryId,
      attemptNumber: input.attemptNumber,
      provider: input.provider,
      status: "started",
      startedAt: input.startedAt,
      finishedAt: null,
      providerMessageId: null,
      failureCategory: null,
      failureReason: null,
      latencyMs: null,
    };
    this.attempts.set(attempt.id, attempt);
    const delivery = this.deliveries.get(input.deliveryId);
    if (delivery) {
      this.deliveries.set(delivery.id, {
        ...delivery,
        attemptCount: input.attemptNumber,
        stateVersion: delivery.stateVersion + 1,
      });
    }
    return attempt;
  }

  async finishAttempt(input: FinishAttemptInput): Promise<void> {
    const attempt = this.attempts.get(input.attemptId);
    if (!attempt) return;
    this.attempts.set(attempt.id, {
      ...attempt,
      status: input.status,
      finishedAt: input.finishedAt,
      providerMessageId: input.providerMessageId ?? null,
      failureCategory: input.failureCategory ?? null,
      failureReason: input.failureReason ?? null,
      latencyMs: input.latencyMs ?? null,
    });
  }

  async finishAttemptAndMarkAccepted(
    input: FinishAttemptAndMarkAcceptedInput,
  ): Promise<EmailDeliveryRecord> {
    await this.finishAttempt({ ...input, status: "accepted" });
    const delivery = this.deliveries.get(input.deliveryId);
    if (!delivery) throw new Error("Delivery not found");
    const updated: EmailDeliveryRecord = {
      ...delivery,
      status: "accepted",
      acceptedProvider: input.provider,
      providerMessageId: input.providerMessageId ?? null,
      acceptedAt: input.acceptedAt,
      lockedBy: null,
      lockedAt: null,
      lockedUntil: null,
      updatedAt: input.finishedAt,
      stateVersion: delivery.stateVersion + 1,
    };
    this.deliveries.set(updated.id, updated);
    return updated;
  }

  async markFailed(input: MarkFailedInput): Promise<EmailDeliveryRecord> {
    const delivery = this.required(input.deliveryId);
    const updated: EmailDeliveryRecord = {
      ...delivery,
      status: "failed",
      failureCategory: input.failureCategory,
      failureReason: input.failureReason,
      failedAt: input.failedAt,
      lockedBy: null,
      lockedAt: null,
      lockedUntil: null,
      updatedAt: input.failedAt,
      stateVersion: delivery.stateVersion + 1,
    };
    this.deliveries.set(updated.id, updated);
    return updated;
  }

  async scheduleRetry(input: ScheduleRetryInput): Promise<EmailDeliveryRecord> {
    const delivery = this.required(input.deliveryId);
    const updated: EmailDeliveryRecord = {
      ...delivery,
      status: "retry_scheduled",
      failureCategory: input.failureCategory,
      failureReason: input.failureReason,
      nextAttemptAt: input.nextAttemptAt,
      lockedBy: null,
      lockedAt: null,
      lockedUntil: null,
      updatedAt: input.now,
      stateVersion: delivery.stateVersion + 1,
    };
    this.deliveries.set(updated.id, updated);
    return updated;
  }

  async appendEvent(input: AppendDeliveryEventInput): Promise<void> {
    this.events.set(randomUUID(), {
      id: randomUUID(),
      deliveryId: input.deliveryId,
      provider: input.provider ?? null,
      providerEventId: input.providerEventId ?? null,
      providerMessageId: input.providerMessageId ?? null,
      eventType: input.eventType,
      occurredAt: input.occurredAt,
      receivedAt: input.receivedAt,
      reasonCategory: input.reasonCategory ?? null,
      safeDetails: input.safeDetails ?? null,
    });
  }

  async findByRequestId(requestId: string): Promise<EmailDeliveryDetail | null> {
    const delivery = [...this.deliveries.values()].find((item) => item.requestId === requestId);
    return delivery ? this.detail(delivery) : null;
  }

  async repairAcceptedAttemptOrphans(): Promise<number> {
    return 0;
  }

  async releaseExpiredLeases(): Promise<number> {
    return 0;
  }

  private required(deliveryId: string): EmailDeliveryRecord {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) throw new Error("Delivery not found");
    return delivery;
  }

  private detail(delivery: EmailDeliveryRecord): EmailDeliveryDetail {
    return {
      ...delivery,
      attempts: [...this.attempts.values()].filter(
        (attempt) => attempt.deliveryId === delivery.id,
      ),
      events: [...this.events.values()].filter((event) => event.deliveryId === delivery.id),
    };
  }
}
