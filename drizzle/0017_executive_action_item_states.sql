CREATE SCHEMA IF NOT EXISTS "executive";

CREATE TABLE IF NOT EXISTS "executive"."action_item_states" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rule_id" varchar(80) NOT NULL,
  "source_key" varchar(255) NOT NULL,
  "severity" varchar(16) NOT NULL,
  "source_page" varchar(64) NOT NULL,
  "source_section" varchar(80) NOT NULL,
  "entity_type" varchar(64) NOT NULL,
  "entity_id" varchar(255) NOT NULL,
  "assigned_owner_id" text REFERENCES "auth"."user"("id") ON DELETE SET NULL,
  "status" varchar(16) NOT NULL DEFAULT 'open',
  "due_at" timestamp,
  "resolution_note" text,
  "first_seen_at" timestamp NOT NULL DEFAULT now(),
  "last_seen_at" timestamp NOT NULL DEFAULT now(),
  "dismissed_at" timestamp,
  "resolved_at" timestamp,
  "reopened_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "exec_action_item_states_severity_chk"
    CHECK ("severity" IN ('critical', 'high', 'medium', 'low')),
  CONSTRAINT "exec_action_item_states_status_chk"
    CHECK ("status" IN ('open', 'in_progress', 'resolved', 'dismissed', 'escalated')),
  CONSTRAINT "exec_action_item_states_reopened_count_chk"
    CHECK ("reopened_count" >= 0)
);
