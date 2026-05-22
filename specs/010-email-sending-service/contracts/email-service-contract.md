# Contract: Email Delivery Service

## Purpose

Internal server-only boundary for sending transactional ScholarX emails with primary-provider delivery, Gmail fallback, durable status, and safe observability.

## Service Method: `sendEmail`

### Request

```ts
type SendEmailRequest = {
  requestId?: string;
  idempotencyKey: string;
  category:
    | "auth_otp"
    | "password_reset"
    | "course_application"
    | "certificate"
    | "admin_operation"
    | "system_test";
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
  requestedByUserId?: string;
  requestedBySystem?: string;
  metadata?: Record<string, string>;
};
```

### Response

```ts
type SendEmailResponse =
  | {
      ok: true;
      deliveryId: string;
      requestId: string;
      status: "accepted";
      provider: "primary" | "gmail_fallback";
      providerMessageId?: string;
      acceptedAt: string;
    }
  | {
      ok: false;
      deliveryId: string;
      requestId: string;
      status: "failed" | "retry_scheduled";
      failureCategory:
        | "validation"
        | "configuration"
        | "authentication"
        | "provider_unavailable"
        | "rate_limited"
        | "recipient_rejected"
        | "content_rejected"
        | "timeout"
        | "unknown";
      message: string;
      retryAfter?: string;
    };
```

## Compatibility Facade: `src/lib/email.ts`

Existing callers may continue using:

```ts
type LegacyEmailRequest = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
};
```

Facade requirements:

- Must call the new email delivery service.
- Must return `{ ok: true, messageId?: string }` for accepted sends to preserve current caller behavior.
- Must throw a sanitized `Email delivery failed` error for failed sends until callers migrate to the richer result type.
- Must derive a stable idempotency key where callers cannot yet provide one, using category and safe request context.
- Must remain `server-only`.

Facade idempotency derivation:

- `auth_otp`: derive from category, normalized recipient, OTP purpose, and the OTP issuance identifier when available; otherwise use a short time bucket no wider than the OTP resend throttle window.
- `password_reset`: derive from category, normalized recipient, and the specific reset token or reset request identifier when available; do not use a broad user-only key because users may legitimately request a second reset after the first request expires or is abandoned.
- `system_test`: derive from category, normalized recipient, subject hash, and caller-provided request ID when available.
- Fallback derivation must include enough request-specific entropy to prevent unrelated legitimate emails from collapsing into the same delivery record.

## Provider Port

```ts
type EmailProviderRequest = {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

type EmailProviderResult =
  | {
      accepted: true;
      providerMessageId?: string;
      rawAcceptedAt: Date;
    }
  | {
      accepted: false;
      failureCategory: EmailFailureCategory;
      safeReason: string;
      retryable: boolean;
      fallbackEligible: boolean;
    };

interface EmailProvider {
  readonly name: "primary" | "gmail_fallback";
  send(request: EmailProviderRequest): Promise<EmailProviderResult>;
  checkHealth(): Promise<"healthy" | "degraded" | "unavailable">;
}
```

## Typed Configuration

Environment variables must be parsed outside the factory and passed in as a typed object.

```ts
type EmailProviderConfig = {
  name: "primary" | "gmail_fallback";
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
  displayName: string;
  timeoutMs: number;
};

type EmailServiceConfig = {
  providers: EmailProviderConfig[];
  fallbackEnabled: boolean;
  maxAttempts: number;
  retryDelaySeconds: number;
  workerLeaseSeconds: number;
  workerBatchSize: number;
  staleSendingTimeoutSeconds: number;
  circuitBreaker: {
    failureThreshold: number;
    cooldownSeconds: number;
    halfOpenProbeLimit: number;
  };
  rateLimits: {
    perRecipientPerHour: number;
    perCategoryPerMinute: number;
    perCallerPerMinute: number;
  };
};

function createEmailDeliveryService(dependencies: {
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
}): EmailDeliveryService;
```

The factory must not read `process.env`.

## Policy Ports

```ts
type RetryDecision =
  | { action: "retry"; nextAttemptAt: Date; reason: string }
  | { action: "fail"; reason: string };

interface EmailRetryPolicy {
  decide(input: {
    delivery: EmailDeliveryRecord;
    latestAttempt: EmailDeliveryAttemptRecord;
    now: Date;
  }): RetryDecision;
}

type FallbackDecision =
  | { action: "fallback"; provider: "gmail_fallback"; reason: string }
  | { action: "skip"; reason: string };

interface EmailFallbackPolicy {
  decide(input: {
    delivery: EmailDeliveryRecord;
    failedProvider: "primary" | "gmail_fallback";
    failureCategory: EmailFailureCategory;
    retryable: boolean;
    fallbackEligible: boolean;
    circuitState: "closed" | "open" | "half_open";
  }): FallbackDecision;
}
```

## Circuit Breaker Port

```ts
interface ProviderCircuitBreaker {
  beforeAttempt(provider: "primary" | "gmail_fallback", now: Date): Promise<
    | { allowed: true; state: "closed" | "half_open" }
    | { allowed: false; state: "open"; retryAfter: Date }
  >;
  recordSuccess(provider: "primary" | "gmail_fallback", now: Date): Promise<void>;
  recordFailure(input: {
    provider: "primary" | "gmail_fallback";
    failureCategory: EmailFailureCategory;
    now: Date;
  }): Promise<void>;
}
```

Production implementation rule: the circuit breaker must be backed by shared persistence using `ProviderCircuitState`. In-memory state may be used only as a short-lived cache of the database state and must not be the source of truth in a multi-worker deployment.

## Rate Limiter Port

```ts
interface EmailRateLimiter {
  checkAndIncrement(input: {
    category: SendEmailRequest["category"];
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
```

## Metrics Port

```ts
interface EmailMetricsSink {
  increment(
    metric:
      | "email_delivery_requested_total"
      | "email_delivery_accepted_total"
      | "email_delivery_failed_total"
      | "email_delivery_fallback_attempted_total"
      | "email_delivery_retry_scheduled_total"
      | "email_delivery_bounced_total"
      | "email_delivery_complained_total"
      | "email_provider_circuit_open_total"
      | "email_rate_limited_total",
    labels: Record<string, string>,
  ): void;
  observe(
    metric:
      | "email_provider_latency_ms"
      | "email_delivery_end_to_end_latency_ms"
      | "email_worker_batch_duration_ms"
      | "email_retry_depth",
    value: number,
    labels: Record<string, string>,
  ): void;
}
```

## Repository Port

```ts
interface EmailDeliveryRepository {
  createOrReuseDelivery(request: CreateDeliveryInput): Promise<EmailDeliveryRecord>;
  claimDeliveryForSending(input: {
    deliveryId: string;
    workerId: string;
    lockedUntil: Date;
    expectedStateVersion?: number;
  }): Promise<EmailDeliveryRecord | null>;
  claimRetryableBatch(input: {
    workerId: string;
    lockedUntil: Date;
    limit: number;
    now: Date;
  }): Promise<EmailDeliveryRecord[]>;
  createAttempt(input: CreateAttemptInput): Promise<EmailDeliveryAttemptRecord>;
  finishAttempt(input: FinishAttemptInput): Promise<void>;
  finishAttemptAndMarkAccepted(input: FinishAttemptAndMarkAcceptedInput): Promise<EmailDeliveryRecord>;
  markFailed(input: MarkFailedInput): Promise<EmailDeliveryRecord>;
  scheduleRetry(input: ScheduleRetryInput): Promise<EmailDeliveryRecord>;
  appendEvent(input: AppendDeliveryEventInput): Promise<void>;
  findByRequestId(requestId: string): Promise<EmailDeliveryDetail | null>;
  repairAcceptedAttemptOrphans(input: { now: Date; limit: number }): Promise<number>;
  releaseExpiredLeases(input: { now: Date; limit: number }): Promise<number>;
}
```

Repository requirements:

- `claimRetryableBatch` must use `FOR UPDATE SKIP LOCKED` or an equivalent atomic update pattern.
- `finishAttemptAndMarkAccepted` must update attempt and delivery in one transaction.
- Claim methods return `null` or omit rows when another worker has already claimed the delivery.
- Repair methods must not perform provider calls.

## Behavioral Rules

- Primary provider is always attempted before Gmail fallback.
- Gmail fallback is attempted only when enabled and the primary failure is fallback-eligible.
- Provider acceptance stops further attempts for the same delivery.
- Every provider call must have a corresponding attempt row.
- Errors returned to callers must not include secrets, credentials, raw provider payloads, or full message bodies.
- The service must distinguish accepted from delivered.
- The worker must check for an existing accepted attempt before making a new provider call.
- Provider circuit state and rate limits must be checked before provider calls.
