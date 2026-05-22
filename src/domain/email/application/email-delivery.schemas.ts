import { z } from "zod";

export const emailCategorySchema = z.enum([
  "auth_otp",
  "password_reset",
  "course_application",
  "certificate",
  "admin_operation",
  "system_test",
]);

export const emailProviderNameSchema = z.enum(["primary", "gmail_fallback"]);

export const sendEmailRequestSchema = z.object({
  requestId: z.string().trim().min(1).max(180).optional(),
  idempotencyKey: z.string().trim().min(8).max(255),
  category: emailCategorySchema,
  to: z.email().trim().max(320),
  from: z.email().trim().max(320).optional(),
  replyTo: z.email().trim().max(320).optional(),
  subject: z.string().trim().min(1).max(998),
  text: z.string().min(1).max(200_000),
  html: z.string().max(500_000).optional(),
  requestedByUserId: z.string().trim().min(1).max(255).optional(),
  requestedBySystem: z.string().trim().min(1).max(120).optional(),
  metadata: z.record(z.string().max(80), z.string().max(500)).optional(),
});

const providerConfigSchema = z.object({
  name: emailProviderNameSchema,
  enabled: z.boolean(),
  host: z.string().trim().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().trim().min(1),
  password: z.string().min(1),
  from: z.email().trim(),
  displayName: z.string().trim().min(1).max(120),
  timeoutMs: z.number().int().min(1_000).max(120_000),
});

export const emailServiceConfigSchema = z.object({
  providers: z.array(providerConfigSchema).min(1),
  fallbackEnabled: z.boolean(),
  maxAttempts: z.number().int().min(1).max(10),
  retryDelaySeconds: z.number().int().min(1).max(86_400),
  workerLeaseSeconds: z.number().int().min(10).max(3_600),
  workerBatchSize: z.number().int().min(1).max(1_000),
  staleSendingTimeoutSeconds: z.number().int().min(10).max(86_400),
  circuitBreaker: z.object({
    failureThreshold: z.number().int().min(1).max(100),
    cooldownSeconds: z.number().int().min(1).max(86_400),
    halfOpenProbeLimit: z.number().int().min(1).max(100),
  }),
  rateLimits: z.object({
    perRecipientPerHour: z.number().int().min(1).max(10_000),
    perCategoryPerMinute: z.number().int().min(1).max(100_000),
    perCallerPerMinute: z.number().int().min(1).max(100_000),
  }),
});

export type ParsedSendEmailRequest = z.infer<typeof sendEmailRequestSchema>;
export type ParsedEmailServiceConfig = z.infer<typeof emailServiceConfigSchema>;
