-- Migration: Create certificates schema and tables
-- Run with: pnpm db:migrate (after setting DATABASE_URL)
-- This migration creates the canonical certificates bounded context.
-- The legacy courses.certificates table is preserved until Phase 5 cutover.

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS "certificates";

-- ---------------------------------------------------------------------------
-- certificates.certificates — canonical issued credentials
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "certificates"."certificates" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "certificate_number"       varchar(64) NOT NULL,
  "short_id"                 varchar(64),
  "user_id"                  text NOT NULL REFERENCES "app_auth"."user"("id") ON DELETE CASCADE,
  "recipient_name"           varchar(255) NOT NULL,
  "recipient_email"          varchar(255),
  "source_type"              varchar(32) NOT NULL DEFAULT 'course_completion',
  "source_id"                uuid,
  "course_id"                uuid,
  "course_progress_id"       uuid,
  "program_name"             varchar(255) NOT NULL,
  "completion_date"          timestamp NOT NULL,
  "status"                   varchar(16) NOT NULL DEFAULT 'issued',
  "issued_at"                timestamp NOT NULL DEFAULT now(),
  "claimed_at"               timestamp,
  "revoked_at"               timestamp,
  "revoked_reason"           text,
  "revoked_by"               text REFERENCES "app_auth"."user"("id"),
  "signature_hex"            text,
  "claim_token"              varchar(255),
  "claim_token_expires_at"   timestamp,
  "pdf_storage_key"          text,
  "png_storage_key"          text,
  "is_public"                boolean NOT NULL DEFAULT true,
  "metadata"                 jsonb NOT NULL DEFAULT '{}',
  "rule_version"             varchar(32) NOT NULL DEFAULT 'course_completion_v1',
  "completion_source"        varchar(32) NOT NULL DEFAULT 'live',
  "season_number"            integer,
  "role"                     varchar(64),
  "created_at"               timestamp NOT NULL DEFAULT now(),
  "updated_at"               timestamp NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "certs_certificate_number_uq"
  ON "certificates"."certificates" ("certificate_number");

CREATE UNIQUE INDEX IF NOT EXISTS "certs_source_uq"
  ON "certificates"."certificates" ("user_id", "source_type", "source_id")
  WHERE "revoked_at" IS NULL;

CREATE INDEX IF NOT EXISTS "certs_public_lookup_idx"
  ON "certificates"."certificates" ("certificate_number", "status")
  WHERE "is_public" = true;

CREATE INDEX IF NOT EXISTS "certs_user_idx"
  ON "certificates"."certificates" ("user_id");

-- ---------------------------------------------------------------------------
-- certificates.certificate_artifacts — per-artifact state machine rows
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "certificates"."certificate_artifacts" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "certificate_id"      uuid NOT NULL REFERENCES "certificates"."certificates"("id") ON DELETE CASCADE,
  "artifact_type"       varchar(16) NOT NULL DEFAULT 'pdf',
  "template_version"    varchar(64) NOT NULL DEFAULT 'scholarx-v1',
  "status"              varchar(16) NOT NULL DEFAULT 'pending',
  "storage_provider"    varchar(32) NOT NULL DEFAULT 'azure_blob',
  "storage_container"   varchar(128),
  "storage_key"         text,
  "content_type"        varchar(64),
  "byte_size"           bigint,
  "checksum_sha256"     varchar(64),
  "error_code"          varchar(64),
  "error_message"       text,
  "attempts"            integer NOT NULL DEFAULT 0,
  "next_attempt_at"     timestamp,
  "generated_at"        timestamp,
  "created_at"          timestamp NOT NULL DEFAULT now(),
  "updated_at"          timestamp NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "cert_artifacts_cert_type_version_uq"
  ON "certificates"."certificate_artifacts" ("certificate_id", "artifact_type", "template_version");

CREATE INDEX IF NOT EXISTS "cert_artifacts_status_idx"
  ON "certificates"."certificate_artifacts" ("status", "next_attempt_at");

-- ---------------------------------------------------------------------------
-- certificates.certificate_artifact_queue — durable Service Bus outbox
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "certificates"."certificate_artifact_queue" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "artifact_id"     uuid NOT NULL REFERENCES "certificates"."certificate_artifacts"("id") ON DELETE CASCADE,
  "certificate_id"  uuid NOT NULL REFERENCES "certificates"."certificates"("id") ON DELETE CASCADE,
  "message_id"      varchar(255) NOT NULL,
  "queue_name"      varchar(128) NOT NULL DEFAULT 'certificate-artifact-generation',
  "status"          varchar(16) NOT NULL DEFAULT 'pending',
  "attempts"        integer NOT NULL DEFAULT 0,
  "last_error"      text,
  "published_at"    timestamp,
  "next_attempt_at" timestamp,
  "created_at"      timestamp NOT NULL DEFAULT now(),
  "updated_at"      timestamp NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "cert_artifact_queue_message_id_uq"
  ON "certificates"."certificate_artifact_queue" ("message_id");

CREATE INDEX IF NOT EXISTS "cert_artifact_queue_repair_idx"
  ON "certificates"."certificate_artifact_queue" ("status", "published_at", "created_at");

-- ---------------------------------------------------------------------------
-- certificates.certificate_events — append-only audit log
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "certificates"."certificate_events" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "certificate_id"   uuid NOT NULL REFERENCES "certificates"."certificates"("id") ON DELETE CASCADE,
  "event_type"       varchar(64) NOT NULL,
  "actor_id"         text,
  "actor_role"       varchar(32),
  "ip_region"        varchar(32),
  "user_agent_hash"  varchar(64),
  "metadata"         jsonb NOT NULL DEFAULT '{}',
  "occurred_at"      timestamp NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "cert_events_certificate_idx"
  ON "certificates"."certificate_events" ("certificate_id", "occurred_at");

CREATE INDEX IF NOT EXISTS "cert_events_type_occurred_idx"
  ON "certificates"."certificate_events" ("event_type", "occurred_at");
