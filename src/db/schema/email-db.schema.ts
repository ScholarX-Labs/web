import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user as dbUsers } from "@/db/schema/auth-schema";
import type {
  EmailAttemptStatus,
  EmailBodyStorageMode,
  EmailCategory,
  EmailDeliveryStatus,
  EmailEventType,
  EmailFailureCategory,
  EmailProviderName,
  EmailRateLimitScope,
  ProviderCircuitStateName,
} from "@/domain/email/contracts/email-types";

export const emailSchema = pgSchema("email");

export const dbEmailBatches = emailSchema.table("email_batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: varchar("category", { length: 64 }).$type<EmailCategory>().notNull(),
  requestedByUserId: text("requested_by_user_id")
    .notNull()
    .references(() => dbUsers.id, { onDelete: "cascade" }),
  totalCount: integer("total_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dbEmailDeliveries = emailSchema.table(
  "email_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: varchar("request_id", { length: 180 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    category: varchar("category", { length: 64 }).$type<EmailCategory>().notNull(),
    status: varchar("status", { length: 32 })
      .$type<EmailDeliveryStatus>()
      .notNull()
      .default("queued"),
    recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
    recipientHash: varchar("recipient_hash", { length: 64 }).notNull(),
    senderIdentity: varchar("sender_identity", { length: 320 }).notNull(),
    subjectHash: varchar("subject_hash", { length: 64 }).notNull(),
    subjectPreview: varchar("subject_preview", { length: 120 }),
    bodyStorageMode: varchar("body_storage_mode", { length: 32 })
      .$type<EmailBodyStorageMode>()
      .notNull()
      .default("stored"),
    bodyReference: text("body_reference"),
    textBody: text("text_body"),
    htmlBody: text("html_body"),
    replyTo: varchar("reply_to", { length: 320 }),
    acceptedProvider: varchar("accepted_provider", { length: 32 }).$type<EmailProviderName>(),
    providerMessageId: text("provider_message_id"),
    failureCategory: varchar("failure_category", { length: 64 }).$type<EmailFailureCategory>(),
    failureReason: text("failure_reason"),
    requestedByUserId: text("requested_by_user_id").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    requestedBySystem: varchar("requested_by_system", { length: 120 }),
    metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),
    nextAttemptAt: timestamp("next_attempt_at"),
    attemptCount: integer("attempt_count").notNull().default(0),
    lockedBy: varchar("locked_by", { length: 120 }),
    lockedAt: timestamp("locked_at"),
    lockedUntil: timestamp("locked_until"),
    stateVersion: integer("state_version").notNull().default(0),
    batchId: uuid("batch_id").references(() => dbEmailBatches.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at"),
    failedAt: timestamp("failed_at"),
  },
  (table) => ({
    requestUq: uniqueIndex("email_deliveries_request_uq").on(table.requestId),
    idempotencyUq: uniqueIndex("email_deliveries_idempotency_uq").on(
      table.category,
      table.idempotencyKey,
    ),
    retryClaimIdx: index("email_deliveries_retry_claim_idx").on(
      table.status,
      table.nextAttemptAt,
      table.lockedUntil,
    ),
    lockedUntilIdx: index("email_deliveries_locked_until_idx").on(table.lockedUntil),
    recipientIdx: index("email_deliveries_recipient_idx").on(
      table.recipientHash,
      table.createdAt,
    ),
    adminFilterIdx: index("email_deliveries_admin_filter_idx").on(
      table.category,
      table.status,
      table.createdAt,
    ),
  }),
);

export const dbEmailDeliveryAttempts = emailSchema.table(
  "email_delivery_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => dbEmailDeliveries.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    provider: varchar("provider", { length: 32 }).$type<EmailProviderName>().notNull(),
    status: varchar("status", { length: 32 }).$type<EmailAttemptStatus>().notNull(),
    startedAt: timestamp("started_at").notNull(),
    finishedAt: timestamp("finished_at"),
    providerMessageId: text("provider_message_id"),
    failureCategory: varchar("failure_category", { length: 64 }).$type<EmailFailureCategory>(),
    failureReason: text("failure_reason"),
    latencyMs: integer("latency_ms"),
  },
  (table) => ({
    deliveryAttemptUq: uniqueIndex("email_attempts_delivery_number_uq").on(
      table.deliveryId,
      table.attemptNumber,
    ),
    acceptedAttemptUq: uniqueIndex("email_attempts_one_accepted_uq")
      .on(table.deliveryId)
      .where(sql`${table.status} = 'accepted'`),
    deliveryIdx: index("email_attempts_delivery_idx").on(
      table.deliveryId,
      table.attemptNumber,
    ),
  }),
);

export const dbEmailDeliveryEvents = emailSchema.table(
  "email_delivery_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deliveryId: uuid("delivery_id")
      .notNull()
      .references(() => dbEmailDeliveries.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).$type<EmailProviderName>(),
    providerEventId: varchar("provider_event_id", { length: 255 }),
    providerMessageId: text("provider_message_id"),
    eventType: varchar("event_type", { length: 32 }).$type<EmailEventType>().notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    receivedAt: timestamp("received_at").notNull(),
    reasonCategory: varchar("reason_category", { length: 64 }).$type<EmailFailureCategory>(),
    safeDetails: text("safe_details"),
  },
  (table) => ({
    deliveryEventsIdx: index("email_events_delivery_idx").on(
      table.deliveryId,
      table.occurredAt,
    ),
    providerEventUq: uniqueIndex("email_events_provider_event_uq")
      .on(table.provider, table.providerEventId)
      .where(sql`${table.providerEventId} is not null`),
  }),
);

export const dbEmailProviderCircuitStates = emailSchema.table(
  "email_provider_circuit_states",
  {
    provider: varchar("provider", { length: 32 }).$type<EmailProviderName>().primaryKey(),
    state: varchar("state", { length: 16 })
      .$type<ProviderCircuitStateName>()
      .notNull()
      .default("closed"),
    failureCount: integer("failure_count").notNull().default(0),
    successCount: integer("success_count").notNull().default(0),
    openedAt: timestamp("opened_at"),
    cooldownUntil: timestamp("cooldown_until"),
    lastFailureCategory: varchar("last_failure_category", { length: 64 }).$type<EmailFailureCategory>(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export const dbEmailRateLimitCounters = emailSchema.table(
  "email_rate_limit_counters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scope: varchar("scope", { length: 32 }).$type<EmailRateLimitScope>().notNull(),
    scopeKeyHash: varchar("scope_key_hash", { length: 64 }).notNull(),
    windowStart: timestamp("window_start").notNull(),
    windowSeconds: integer("window_seconds").notNull(),
    count: integer("count").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    bucketUq: uniqueIndex("email_rate_limit_bucket_uq").on(
      table.scope,
      table.scopeKeyHash,
      table.windowStart,
      table.windowSeconds,
    ),
    expiresIdx: index("email_rate_limit_expires_idx").on(table.expiresAt),
  }),
);
