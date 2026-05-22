import test from "node:test";
import assert from "node:assert/strict";
import { EmailDeliveryService } from "@/domain/email/application/email-delivery.service";
import {
  AllowAllCircuitBreaker,
  AllowAllRateLimiter,
  FakeEmailProvider,
  FixedClock,
  InMemoryEmailDeliveryRepository,
  MemoryMetricsSink,
  NoopLogger,
} from "@/domain/email/application/email-test-helpers";
import {
  DefaultEmailFallbackPolicy,
  DefaultEmailRetryPolicy,
} from "@/domain/email/application/email-policies";
import type { EmailServiceConfig } from "@/domain/email/contracts/email-types";
import { drainEmailDeliveries } from "./email-delivery-worker";

const config: EmailServiceConfig = {
  providers: [],
  fallbackEnabled: false,
  maxAttempts: 2,
  retryDelaySeconds: 60,
  workerLeaseSeconds: 120,
  workerBatchSize: 10,
  staleSendingTimeoutSeconds: 300,
  circuitBreaker: {
    failureThreshold: 5,
    cooldownSeconds: 300,
    halfOpenProbeLimit: 1,
  },
  rateLimits: {
    perRecipientPerHour: 20,
    perCategoryPerMinute: 1_000,
    perCallerPerMinute: 100,
  },
};

test("concurrent drain loops do not claim the same delivery", async () => {
  const repository = new InMemoryEmailDeliveryRepository();
  const clock = new FixedClock();
  await repository.createOrReuseDelivery({
    request: {
      category: "system_test",
      idempotencyKey: "worker-1",
      to: "learner@example.com",
      subject: "Worker",
      text: "Body",
    },
    normalizedRecipient: "learner@example.com",
    from: "info@scholar-x.org",
    recipientHash: "hash",
    subjectHash: "subject",
    subjectPreview: "Worker",
    now: clock.now(),
  });

  const service = new EmailDeliveryService({
    config,
    repository,
    providers: [
      new FakeEmailProvider("primary", [
        {
          accepted: true,
          providerMessageId: "primary-worker",
          rawAcceptedAt: clock.now(),
        },
      ]),
    ],
    retryPolicy: new DefaultEmailRetryPolicy(config),
    fallbackPolicy: new DefaultEmailFallbackPolicy(false),
    circuitBreaker: new AllowAllCircuitBreaker(),
    rateLimiter: new AllowAllRateLimiter(),
    metrics: new MemoryMetricsSink(),
    clock,
    logger: new NoopLogger(),
  });

  const [first, second] = await Promise.all([
    drainEmailDeliveries({ repository, service, config, workerId: "w1", now: clock.now() }),
    drainEmailDeliveries({ repository, service, config, workerId: "w2", now: clock.now() }),
  ]);

  assert.equal(first.claimed + second.claimed, 1);
  assert.equal(first.accepted + second.accepted, 1);
});

test("drain continues when one claimed delivery throws", async () => {
  const repository = new InMemoryEmailDeliveryRepository();
  const clock = new FixedClock();
  const first = await repository.createOrReuseDelivery({
    request: {
      category: "system_test",
      idempotencyKey: "worker-throw-1",
      to: "first@example.com",
      subject: "Worker",
      text: "Body",
    },
    normalizedRecipient: "first@example.com",
    from: "info@scholar-x.org",
    recipientHash: "hash-1",
    subjectHash: "subject",
    subjectPreview: "Worker",
    now: clock.now(),
  });
  await repository.createOrReuseDelivery({
    request: {
      category: "system_test",
      idempotencyKey: "worker-throw-2",
      to: "second@example.com",
      subject: "Worker",
      text: "Body",
    },
    normalizedRecipient: "second@example.com",
    from: "info@scholar-x.org",
    recipientHash: "hash-2",
    subjectHash: "subject",
    subjectPreview: "Worker",
    now: clock.now(),
  });

  const service = {
    async processClaimedDelivery(delivery: typeof first) {
      if (delivery.id === first.id) throw new Error("boom");
      return {
        ok: true as const,
        deliveryId: delivery.id,
        requestId: delivery.requestId,
        status: "accepted" as const,
        provider: "primary" as const,
        acceptedAt: clock.now().toISOString(),
      };
    },
  } as EmailDeliveryService;

  const originalError = console.error;
  console.error = () => {};
  try {
    const result = await drainEmailDeliveries({
      repository,
      service,
      config,
      workerId: "w1",
      now: clock.now(),
    });

    assert.equal(result.claimed, 2);
    assert.equal(result.failed, 1);
    assert.equal(result.accepted, 1);
  } finally {
    console.error = originalError;
  }
});
