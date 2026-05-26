-- Run manually in production outside Drizzle transactional migrations.
-- Required because CREATE INDEX CONCURRENTLY cannot run inside a transaction block.

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pse_user_created"
  ON "courses"."progress_sync_events" ("user_id", "created_at" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pse_lesson_created"
  ON "courses"."progress_sync_events" ("lesson_id", "created_at" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pse_course_created"
  ON "courses"."progress_sync_events" ("course_id", "created_at" DESC);
