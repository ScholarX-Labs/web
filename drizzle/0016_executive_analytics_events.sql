CREATE SCHEMA IF NOT EXISTS "executive";

CREATE TABLE IF NOT EXISTS "executive"."analytics_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_type" varchar(64) NOT NULL,
  "occurred_at" timestamp NOT NULL,
  "user_id" text REFERENCES "app_auth"."user"("id") ON DELETE SET NULL,
  "session_id_hash" varchar(128),
  "entity_type" varchar(64),
  "entity_id" varchar(255),
  "source" varchar(255),
  "medium" varchar(255),
  "campaign" varchar(255),
  "device_type" varchar(64),
  "metadata" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "exec_analytics_events_event_type_chk"
    CHECK ("event_type" IN (
      'website_visit',
      'cta_click',
      'signup_started',
      'ai_search',
      'opportunity_apply_click',
      'opportunity_link_check',
      'ai_feedback'
    )),
  CONSTRAINT "exec_analytics_events_no_raw_pii_chk"
    CHECK (jsonb_typeof("metadata") = 'object')
);
