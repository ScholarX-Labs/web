CREATE SCHEMA IF NOT EXISTS "executive";

CREATE TABLE IF NOT EXISTS "executive"."public_impact_metrics" (
  "metric_id" varchar(120) PRIMARY KEY NOT NULL,
  "label" varchar(255) NOT NULL,
  "computed_value" integer NOT NULL,
  "manual_override_value" integer,
  "source_description" text NOT NULL,
  "owner_id" text NOT NULL REFERENCES "auth"."user"("id"),
  "approval_status" varchar(32) NOT NULL DEFAULT 'draft',
  "proposed_by" text REFERENCES "auth"."user"("id") ON DELETE SET NULL,
  "approved_by" text REFERENCES "auth"."user"("id") ON DELETE SET NULL,
  "approved_at" timestamp,
  "rejected_by" text REFERENCES "auth"."user"("id") ON DELETE SET NULL,
  "rejected_at" timestamp,
  "rejection_reason" text,
  "audit_trail" jsonb NOT NULL DEFAULT '[]',
  "auto_publish" boolean NOT NULL DEFAULT false,
  "freshness_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "exec_public_impact_metrics_status_chk"
    CHECK ("approval_status" IN (
      'draft',
      'pending_review',
      'approved',
      'published',
      'rejected',
      'expired',
      'manual_override'
    )),
  CONSTRAINT "exec_public_impact_metrics_audit_trail_chk"
    CHECK (jsonb_typeof("audit_trail") = 'array')
);
