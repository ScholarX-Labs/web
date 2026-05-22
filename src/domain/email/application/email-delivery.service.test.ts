import test from "node:test";
import assert from "node:assert/strict";
import { EmailDeliveryService } from "./email-delivery.service";
import {
  AllowAllCircuitBreaker,
  AllowAllRateLimiter,
  FakeEmailProvider,
  FixedClock,
  InMemoryEmailDeliveryRepository,
  MemoryMetricsSink,
  NoopLogger,
} from "./email-test-helpers";
import {
  DefaultEmailFallbackPolicy,
  DefaultEmailRetryPolicy,
} from "./email-policies";
import type { EmailServiceConfig } from "../contracts/email-types";

const baseConfig: EmailServiceConfig = {
  providers: [],
  fallbackEnabled: true,
  maxAttempts: 2,
  retryDelaySeconds: 60,
  workerLeaseSeconds: 120,
  workerBatchSize: 100,
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

function service(input: { primary: FakeEmailProvider; fallback?: FakeEmailProvider }) {
  const repository = new InMemoryEmailDeliveryRepository();
  const clock = new FixedClock();
  const metrics = new MemoryMetricsSink();
  const emailService = new EmailDeliveryService({
    config: {
      ...baseConfig,
      providers: [
        {
          name: "primary",
          enabled: true,
          host: "primary",
          port: 465,
          secure: true,
          username: "primary",
          password: "secret",
          from: "info@scholar-x.org",
          displayName: "ScholarX",
          timeoutMs: 15_000,
        },
      ],
    },
    repository,
    providers: input.fallback ? [input.primary, input.fallback] : [input.primary],
    retryPolicy: new DefaultEmailRetryPolicy(baseConfig),
    fallbackPolicy: new DefaultEmailFallbackPolicy(true),
    circuitBreaker: new AllowAllCircuitBreaker(),
    rateLimiter: new AllowAllRateLimiter(),
    metrics,
    clock,
    logger: new NoopLogger(),
  });

  return { emailService, repository, metrics };
}

test("sends through primary provider without fallback", async () => {
  const primary = new FakeEmailProvider("primary", [
    {
      accepted: true,
      providerMessageId: "primary-1",
      rawAcceptedAt: new Date("2026-05-22T00:00:00.000Z"),
    },
  ]);
  const fallback = new FakeEmailProvider("gmail_fallback", []);
  const { emailService } = service({ primary, fallback });

  const result = await emailService.sendEmail({
    category: "system_test",
    idempotencyKey: "test-primary-success",
    to: "Learner@Example.com",
    subject: "Hello",
    text: "Body",
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.provider, "primary");
  assert.equal(primary.sent.length, 1);
  assert.equal(fallback.sent.length, 0);
});

test("falls back to Gmail after retryable primary failure", async () => {
  const primary = new FakeEmailProvider("primary", [
    {
      accepted: false,
      failureCategory: "provider_unavailable",
      safeReason: "Temporary failure",
      retryable: true,
      fallbackEligible: true,
    },
  ]);
  const fallback = new FakeEmailProvider("gmail_fallback", [
    {
      accepted: true,
      providerMessageId: "gmail-1",
      rawAcceptedAt: new Date("2026-05-22T00:00:02.000Z"),
    },
  ]);
  const { emailService } = service({ primary, fallback });

  const result = await emailService.sendEmail({
    category: "auth_otp",
    idempotencyKey: "otp-fallback",
    to: "learner@example.com",
    subject: "OTP",
    text: "123456",
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.provider, "gmail_fallback");
  assert.equal(primary.sent.length, 1);
  assert.equal(fallback.sent.length, 1);
});

test("reuses accepted delivery for duplicate idempotency key", async () => {
  const primary = new FakeEmailProvider("primary", [
    {
      accepted: true,
      providerMessageId: "primary-1",
      rawAcceptedAt: new Date("2026-05-22T00:00:00.000Z"),
    },
  ]);
  const { emailService } = service({ primary });
  const request = {
    category: "password_reset" as const,
    idempotencyKey: "reset-token-1",
    to: "learner@example.com",
    subject: "Reset",
    text: "Reset link",
  };

  const first = await emailService.sendEmail(request);
  const second = await emailService.sendEmail(request);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(primary.sent.length, 1);
});

test("schedules retry after full retryable provider failure", async () => {
  const primary = new FakeEmailProvider("primary", [
    {
      accepted: false,
      failureCategory: "provider_unavailable",
      safeReason: "Temporary failure",
      retryable: true,
      fallbackEligible: false,
    },
  ]);
  const { emailService } = service({ primary });

  const result = await emailService.sendEmail({
    category: "system_test",
    idempotencyKey: "retry-needed",
    to: "learner@example.com",
    subject: "Retry",
    text: "Body",
  });

  assert.equal(result.ok, false);
  assert.equal(!result.ok && result.status, "retry_scheduled");
});
