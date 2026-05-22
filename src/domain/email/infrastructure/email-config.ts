import type { EmailProviderConfig, EmailServiceConfig } from "../contracts/email-types";
import { emailServiceConfigSchema } from "../application/email-delivery.schemas";

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function int(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadEmailServiceConfigFromEnv(): EmailServiceConfig {
  const primaryHost =
    process.env.EMAIL_PRIMARY_HOST ??
    process.env.SMTP_HOST ??
    process.env.SMTP_SERVER ??
    "";
  const primaryUser =
    process.env.EMAIL_PRIMARY_USER ??
    process.env.SMTP_USER ??
    process.env.SMTP_EMAIL ??
    "";
  const primaryPassword =
    process.env.EMAIL_PRIMARY_PASSWORD ??
    process.env.SMTP_PASSWORD ??
    process.env.SMTP_PASS ??
    "";
  const primaryFrom =
    process.env.EMAIL_PRIMARY_FROM ??
    process.env.SMTP_FROM ??
    process.env.SMTP_EMAIL ??
    process.env.SMTP_USER ??
    "";

  const primary = providerConfig({
    name: "primary",
    enabled: true,
    host: primaryHost,
    port: int(process.env.EMAIL_PRIMARY_PORT ?? process.env.SMTP_PORT, 587),
    secure: bool(process.env.EMAIL_PRIMARY_SECURE ?? process.env.SMTP_SECURE, false),
    username: primaryUser,
    password: primaryPassword,
    from: primaryFrom,
    displayName: process.env.EMAIL_PRIMARY_DISPLAY_NAME ?? "ScholarX",
    timeoutMs: int(process.env.EMAIL_PROVIDER_TIMEOUT_MS, 15_000),
  });

  const gmail = providerConfig({
    name: "gmail_fallback",
    enabled: bool(process.env.EMAIL_GMAIL_FALLBACK_ENABLED, false),
    host: process.env.EMAIL_GMAIL_HOST ?? "smtp.gmail.com",
    port: int(process.env.EMAIL_GMAIL_PORT, 465),
    secure: bool(process.env.EMAIL_GMAIL_SECURE, true),
    username: process.env.EMAIL_GMAIL_USER ?? "",
    password: process.env.EMAIL_GMAIL_PASSWORD ?? "",
    from: process.env.EMAIL_GMAIL_FROM ?? process.env.EMAIL_GMAIL_USER ?? "",
    displayName: process.env.EMAIL_GMAIL_DISPLAY_NAME ?? "ScholarX",
    timeoutMs: int(process.env.EMAIL_PROVIDER_TIMEOUT_MS, 15_000),
  });

  assertPrimaryProviderConfigured(primary);

  try {
    return emailServiceConfigSchema.parse({
      providers: [primary, gmail].filter((provider) => provider.enabled),
      fallbackEnabled: gmail.enabled,
      maxAttempts: int(process.env.EMAIL_MAX_ATTEMPTS, 3),
      retryDelaySeconds: int(process.env.EMAIL_RETRY_DELAY_SECONDS, 60),
      workerLeaseSeconds: int(process.env.EMAIL_WORKER_LEASE_SECONDS, 120),
      workerBatchSize: int(process.env.EMAIL_WORKER_BATCH_SIZE, 100),
      staleSendingTimeoutSeconds: int(process.env.EMAIL_STALE_SENDING_TIMEOUT_SECONDS, 300),
      circuitBreaker: {
        failureThreshold: int(process.env.EMAIL_CIRCUIT_FAILURE_THRESHOLD, 5),
        cooldownSeconds: int(process.env.EMAIL_CIRCUIT_COOLDOWN_SECONDS, 300),
        halfOpenProbeLimit: int(process.env.EMAIL_CIRCUIT_HALF_OPEN_PROBE_LIMIT, 1),
      },
      rateLimits: {
        perRecipientPerHour: int(process.env.EMAIL_RATE_LIMIT_RECIPIENT_HOUR, 20),
        perCategoryPerMinute: int(process.env.EMAIL_RATE_LIMIT_CATEGORY_MINUTE, 1_000),
        perCallerPerMinute: int(process.env.EMAIL_RATE_LIMIT_CALLER_MINUTE, 100),
      },
    });
  } catch (error) {
    throw new Error("Email service configuration is invalid", { cause: error });
  }
}

function providerConfig(config: EmailProviderConfig): EmailProviderConfig {
  return {
    ...config,
    secure: config.secure || config.port === 465,
  };
}

function assertPrimaryProviderConfigured(config: EmailProviderConfig): void {
  const missing: string[] = [];
  if (!config.host) missing.push("EMAIL_PRIMARY_HOST or SMTP_HOST");
  if (!config.username) missing.push("EMAIL_PRIMARY_USER or SMTP_EMAIL");
  if (!config.password) missing.push("EMAIL_PRIMARY_PASSWORD or SMTP_PASSWORD");
  if (!config.from) missing.push("EMAIL_PRIMARY_FROM or SMTP_FROM");

  if (missing.length > 0) {
    throw new Error(
      `Email primary provider is not configured. Missing: ${missing.join(", ")}`,
    );
  }
}
