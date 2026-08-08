import { sql } from "drizzle-orm";
import {
  text,
  uuid,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user as dbUsers } from "@/db/schema/auth-schema";
import { certificatesSchema } from "./namespaces";

// ---------------------------------------------------------------------------
// Allowed value types (string unions for type safety across the codebase)
// ---------------------------------------------------------------------------

export type CertificateStatus = "pending" | "issued" | "claimed" | "revoked";
export type ArtifactStatus = "pending" | "generating" | "ready" | "failed";
export type ArtifactType = "pdf" | "png_preview";
export type CertificateSourceType = "course_completion" | "admin_award" | "program_completion";
export type CompletionSource = "live" | "backfill_approximate" | "legacy_migration" | "admin_override";
export type StorageProvider = "azure_blob" | "filesystem" | "memory";
export type OutboxStatus = "pending" | "published" | "failed";

// ---------------------------------------------------------------------------
// certificates.certificates — canonical issued credential
// ---------------------------------------------------------------------------

export const dbCanonicalCertificates = certificatesSchema.table(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Public-facing opaque identifier — SX-XXXX-XXXX-… (Crockford Base32)
    certificateNumber: varchar("certificate_number", { length: 64 }).notNull(),

    // Legacy short_id alias; kept only for existing link compatibility
    shortId: varchar("short_id", { length: 64 }),

    // Ownership
    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),
    recipientName: varchar("recipient_name", { length: 255 }).notNull(),
    recipientEmail: varchar("recipient_email", { length: 255 }),

    // Source of issuance — DIP: course domain passes a completed snapshot
    sourceType: varchar("source_type", { length: 32 })
      .$type<CertificateSourceType>()
      .notNull()
      .default("course_completion"),
    sourceId: uuid("source_id"), // e.g. course_progress.id for course_completion
    courseId: uuid("course_id"), // reporting / join metadata
    courseProgressId: uuid("course_progress_id"), // FK reference for joins

    // Certificate identity content snapshot (immutable after issuance)
    programName: varchar("program_name", { length: 255 }).notNull(),
    completionDate: timestamp("completion_date").notNull(),

    // State machine: pending → issued → (claimed | revoked)
    status: varchar("status", { length: 16 })
      .$type<CertificateStatus>()
      .notNull()
      .default("issued"),
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    claimedAt: timestamp("claimed_at"),
    revokedAt: timestamp("revoked_at"),
    revokedReason: text("revoked_reason"),
    revokedBy: text("revoked_by").references(() => dbUsers.id),

    // Crypto / identity (optional)
    signatureHex: text("signature_hex"),
    claimToken: varchar("claim_token", { length: 255 }),
    claimTokenExpiresAt: timestamp("claim_token_expires_at"),

    // Inline storage keys — compatibility layer; prefer certificate_artifacts
    pdfStorageKey: text("pdf_storage_key"),
    pngStorageKey: text("png_storage_key"),

    // Visibility
    isPublic: boolean("is_public").notNull().default(true),

    // Flexible metadata snapshot (rule version, template version, etc.)
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    ruleVersion: varchar("rule_version", { length: 32 })
      .notNull()
      .default("course_completion_v1"),
    completionSource: varchar("completion_source", { length: 32 })
      .$type<CompletionSource>()
      .notNull()
      .default("live"),

    // Legacy cohort / role fields — nullable for course completion certs
    seasonNumber: integer("season_number"),
    role: varchar("role", { length: 64 }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    // Public lookup: certificate number must be globally unique
    certificateNumberUq: uniqueIndex("certs_certificate_number_uq").on(
      t.certificateNumber,
    ),

    // Idempotency: one active certificate per (user, source_type, source_id)
    // Partial index excludes revoked certificates
    sourceUq: uniqueIndex("certs_source_uq").on(
      t.userId,
      t.sourceType,
      t.sourceId,
    ).where(sql`${t.revokedAt} is null`),

    // Fast public verification page lookup
    publicLookupIdx: index("certs_public_lookup_idx").on(
      t.certificateNumber,
      t.status,
    ).where(sql`${t.isPublic} = true`),

    // Support lookups by user
    userIdx: index("certs_user_idx").on(t.userId),
  }),
);

// ---------------------------------------------------------------------------
// certificates.certificate_artifacts — per-artifact state machine row
// ---------------------------------------------------------------------------

export const dbCertificateArtifacts = certificatesSchema.table(
  "certificate_artifacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    certificateId: uuid("certificate_id")
      .notNull()
      .references(() => dbCanonicalCertificates.id, { onDelete: "cascade" }),

    // One row per (certificate, type, template version)
    artifactType: varchar("artifact_type", { length: 16 })
      .$type<ArtifactType>()
      .notNull()
      .default("pdf"),
    templateVersion: varchar("template_version", { length: 64 })
      .notNull()
      .default("scholarx-v1"),

    // State machine: pending → generating → ready | failed
    status: varchar("status", { length: 16 })
      .$type<ArtifactStatus>()
      .notNull()
      .default("pending"),

    // Storage
    storageProvider: varchar("storage_provider", { length: 32 })
      .$type<StorageProvider>()
      .notNull()
      .default("azure_blob"),
    storageContainer: varchar("storage_container", { length: 128 }),
    storageKey: text("storage_key"),
    contentType: varchar("content_type", { length: 64 }),
    byteSize: bigint("byte_size", { mode: "number" }),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),

    // Failure tracking
    errorCode: varchar("error_code", { length: 64 }),
    errorMessage: text("error_message"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at"),

    generatedAt: timestamp("generated_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    // One artifact row per certificate + type + template version
    artifactUq: uniqueIndex("cert_artifacts_cert_type_version_uq").on(
      t.certificateId,
      t.artifactType,
      t.templateVersion,
    ),
    // Worker claim index: efficient lookup of pending/failed rows
    artifactStatusIdx: index("cert_artifacts_status_idx").on(
      t.status,
      t.nextAttemptAt,
    ),
  }),
);

// ---------------------------------------------------------------------------
// certificates.certificate_artifact_queue — durable outbox for Service Bus
// ---------------------------------------------------------------------------

export const dbCertificateArtifactQueue = certificatesSchema.table(
  "certificate_artifact_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artifactId: uuid("artifact_id")
      .notNull()
      .references(() => dbCertificateArtifacts.id, { onDelete: "cascade" }),
    certificateId: uuid("certificate_id")
      .notNull()
      .references(() => dbCanonicalCertificates.id, { onDelete: "cascade" }),

    // Duplicate detection: stable ID for Azure Service Bus
    messageId: varchar("message_id", { length: 255 }).notNull(),
    queueName: varchar("queue_name", { length: 128 })
      .notNull()
      .default("certificate-artifact-generation"),

    // Outbox status
    status: varchar("status", { length: 16 })
      .$type<OutboxStatus>()
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    publishedAt: timestamp("published_at"),
    nextAttemptAt: timestamp("next_attempt_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    // Service Bus duplicate detection requires globally unique message IDs
    messageIdUq: uniqueIndex("cert_artifact_queue_message_id_uq").on(
      t.messageId,
    ),
    // Repair job index: find unpublished rows by created_at
    repairIdx: index("cert_artifact_queue_repair_idx").on(
      t.status,
      t.publishedAt,
      t.createdAt,
    ),
  }),
);

// ---------------------------------------------------------------------------
// certificates.certificate_events — append-only audit log
// ---------------------------------------------------------------------------

export const dbCertificateEvents = certificatesSchema.table(
  "certificate_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    certificateId: uuid("certificate_id")
      .notNull()
      .references(() => dbCanonicalCertificates.id, { onDelete: "cascade" }),

    eventType: varchar("event_type", { length: 64 }).notNull(),
    actorId: text("actor_id"),
    actorRole: varchar("actor_role", { length: 32 }),
    ipRegion: varchar("ip_region", { length: 32 }),
    userAgentHash: varchar("user_agent_hash", { length: 64 }),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),

    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  },
  (t) => ({
    // Events are queried by certificate ID in chronological order
    certEventsIdx: index("cert_events_certificate_idx").on(
      t.certificateId,
      t.occurredAt,
    ),
    // Event type analytics
    certEventsTypeIdx: index("cert_events_type_occurred_idx").on(
      t.eventType,
      t.occurredAt,
    ),
  }),
);
