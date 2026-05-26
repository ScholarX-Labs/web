-- Production note: create these indexes CONCURRENTLY in a manual production migration
-- if the target database already has large executive/event tables. Drizzle managed
-- migrations may run in a transaction, so this checked-in migration avoids CONCURRENTLY.

CREATE INDEX IF NOT EXISTS "exec_analytics_events_type_occurred_idx"
  ON "executive"."analytics_events" ("event_type", "occurred_at" DESC);

CREATE INDEX IF NOT EXISTS "exec_analytics_events_user_occurred_idx"
  ON "executive"."analytics_events" ("user_id", "occurred_at" DESC)
  WHERE "user_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "exec_analytics_events_session_occurred_idx"
  ON "executive"."analytics_events" ("session_id_hash", "occurred_at" DESC)
  WHERE "session_id_hash" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_pse_user_created"
  ON "courses"."progress_sync_events" ("user_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_pse_lesson_created"
  ON "courses"."progress_sync_events" ("lesson_id", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_pse_course_created"
  ON "courses"."progress_sync_events" ("course_id", "created_at" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "exec_action_item_states_source_key_uq"
  ON "executive"."action_item_states" ("source_key");

CREATE INDEX IF NOT EXISTS "exec_action_item_states_severity_status_idx"
  ON "executive"."action_item_states" ("severity", "status", "due_at")
  WHERE "status" IN ('open', 'in_progress', 'escalated');

CREATE INDEX IF NOT EXISTS "exec_metric_freshness_source_status_idx"
  ON "executive"."metric_freshness" ("source_key", "status");

CREATE INDEX IF NOT EXISTS "exec_public_impact_status_freshness_idx"
  ON "executive"."public_impact_metrics" ("approval_status", "freshness_at");

CREATE INDEX IF NOT EXISTS "exec_public_impact_owner_status_idx"
  ON "executive"."public_impact_metrics" ("owner_id", "approval_status");
