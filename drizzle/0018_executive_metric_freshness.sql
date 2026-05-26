CREATE SCHEMA IF NOT EXISTS "executive";

CREATE TABLE IF NOT EXISTS "executive"."metric_freshness" (
  "section_id" varchar(120) PRIMARY KEY NOT NULL,
  "source_key" varchar(120) NOT NULL,
  "last_successful_at" timestamp,
  "last_attempted_at" timestamp NOT NULL,
  "status" varchar(16) NOT NULL,
  "last_error_code" varchar(120),
  "last_query_duration_ms" integer,
  "rolling_p95_duration_ms" integer,
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "exec_metric_freshness_status_chk"
    CHECK ("status" IN ('current', 'stale', 'very_stale', 'unavailable')),
  CONSTRAINT "exec_metric_freshness_last_query_duration_chk"
    CHECK ("last_query_duration_ms" IS NULL OR "last_query_duration_ms" >= 0),
  CONSTRAINT "exec_metric_freshness_rolling_p95_duration_chk"
    CHECK ("rolling_p95_duration_ms" IS NULL OR "rolling_p95_duration_ms" >= 0)
);
