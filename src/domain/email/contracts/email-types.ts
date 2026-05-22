export type EmailProviderName = "primary" | "gmail_fallback";

export type EmailCategory =
  | "auth_otp"
  | "password_reset"
  | "course_application"
  | "certificate"
  | "admin_operation"
  | "system_test";

export type EmailDeliveryStatus =
  | "queued"
  | "sending"
  | "accepted"
  | "retry_scheduled"
  | "failed"
  | "cancelled"
  | "delivered"
  | "bounced"
  | "complained";

export type EmailAttemptStatus =
  | "started"
  | "accepted"
  | "failed"
  | "timed_out"
  | "cancelled";

export type EmailFailureCategory =
  | "validation"
  | "configuration"
  | "authentication"
  | "provider_unavailable"
  | "rate_limited"
  | "recipient_rejected"
  | "content_rejected"
  | "timeout"
  | "unknown";

export type EmailEventType =
  | "delivered"
  | "bounced"
  | "complained"
  | "deferred"
  | "opened"
  | "clicked"
  | "manual_note";

export type EmailBodyStorageMode =
  | "not_stored"
  | "stored"
  | "template_reference";

export type ProviderCircuitStateName = "closed" | "open" | "half_open";

export type EmailRateLimitScope =
  | "caller"
  | "category"
  | "recipient"
  | "caller_category";

export type SendEmailRequest = {
  requestId?: string;
  idempotencyKey: string;
  category: EmailCategory;
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

export type SendEmailResponse =
  | {
      ok: true;
      deliveryId: string;
      requestId: string;
      status: "accepted";
      provider: EmailProviderName;
      providerMessageId?: string;
      acceptedAt: string;
    }
  | {
      ok: false;
      deliveryId: string;
      requestId: string;
      status: "failed" | "retry_scheduled";
      failureCategory: EmailFailureCategory;
      message: string;
      retryAfter?: string;
    };

export type EmailDeliveryRecord = {
  id: string;
  requestId: string;
  idempotencyKey: string;
  category: EmailCategory;
  status: EmailDeliveryStatus;
  recipientEmail: string;
  recipientHash: string;
  senderIdentity: string;
  subjectHash: string;
  subjectPreview?: string | null;
  bodyStorageMode: EmailBodyStorageMode;
  bodyReference?: string | null;
  text?: string | null;
  html?: string | null;
  replyTo?: string | null;
  acceptedProvider?: EmailProviderName | null;
  providerMessageId?: string | null;
  failureCategory?: EmailFailureCategory | null;
  failureReason?: string | null;
  requestedByUserId?: string | null;
  requestedBySystem?: string | null;
  metadata: Record<string, string>;
  nextAttemptAt?: Date | null;
  attemptCount: number;
  lockedBy?: string | null;
  lockedAt?: Date | null;
  lockedUntil?: Date | null;
  stateVersion: number;
  batchId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  acceptedAt?: Date | null;
  failedAt?: Date | null;
};

export type EmailDeliveryAttemptRecord = {
  id: string;
  deliveryId: string;
  attemptNumber: number;
  provider: EmailProviderName;
  status: EmailAttemptStatus;
  startedAt: Date;
  finishedAt?: Date | null;
  providerMessageId?: string | null;
  failureCategory?: EmailFailureCategory | null;
  failureReason?: string | null;
  latencyMs?: number | null;
};

export type EmailDeliveryEventRecord = {
  id: string;
  deliveryId: string;
  provider?: EmailProviderName | null;
  providerEventId?: string | null;
  providerMessageId?: string | null;
  eventType: EmailEventType;
  occurredAt: Date;
  receivedAt: Date;
  reasonCategory?: EmailFailureCategory | null;
  safeDetails?: string | null;
};

export type EmailDeliveryDetail = EmailDeliveryRecord & {
  attempts: EmailDeliveryAttemptRecord[];
  events: EmailDeliveryEventRecord[];
};

export type EmailProviderRequest = {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailProviderResult =
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

export type EmailProviderConfig = {
  name: EmailProviderName;
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

export type EmailServiceConfig = {
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

export type CreateDeliveryInput = {
  request: SendEmailRequest;
  normalizedRecipient: string;
  from: string;
  recipientHash: string;
  subjectHash: string;
  subjectPreview: string;
  now: Date;
};

export type CreateAttemptInput = {
  deliveryId: string;
  attemptNumber: number;
  provider: EmailProviderName;
  startedAt: Date;
};

export type FinishAttemptInput = {
  attemptId: string;
  status: Exclude<EmailAttemptStatus, "started">;
  finishedAt: Date;
  providerMessageId?: string;
  failureCategory?: EmailFailureCategory;
  failureReason?: string;
  latencyMs?: number;
};

export type FinishAttemptAndMarkAcceptedInput = FinishAttemptInput & {
  deliveryId: string;
  provider: EmailProviderName;
  acceptedAt: Date;
};

export type MarkFailedInput = {
  deliveryId: string;
  failureCategory: EmailFailureCategory;
  failureReason: string;
  failedAt: Date;
};

export type ScheduleRetryInput = {
  deliveryId: string;
  failureCategory: EmailFailureCategory;
  failureReason: string;
  nextAttemptAt: Date;
  now: Date;
};

export type AppendDeliveryEventInput = {
  deliveryId: string;
  provider?: EmailProviderName;
  providerEventId?: string;
  providerMessageId?: string;
  eventType: EmailEventType;
  occurredAt: Date;
  receivedAt: Date;
  reasonCategory?: EmailFailureCategory;
  safeDetails?: string;
};
