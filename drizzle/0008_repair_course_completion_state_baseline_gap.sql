-- Forward repair for environments where the baseline helper recorded
-- 0006/0007 in drizzle.__drizzle_migrations without executing their SQL.
-- This migration is intentionally idempotent and must remain safe to run
-- after a correct 0006/0007 application.

ALTER TABLE "courses"."courses"
  ADD COLUMN IF NOT EXISTS "curriculum_version" integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "required_lessons_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "certificate_enabled" boolean NOT NULL DEFAULT true;
--> statement-breakpoint

UPDATE "courses"."courses" c
SET "required_lessons_count" = COALESCE(l.required_lessons, 0)
FROM (
  SELECT
    course_id,
    count(*)::integer AS required_lessons
  FROM "courses"."lessons"
  WHERE status = 'active'
    AND is_archived = false
  GROUP BY course_id
) l
WHERE c.id = l.course_id;
--> statement-breakpoint

ALTER TABLE "courses"."lesson_progress"
  ADD COLUMN IF NOT EXISTS "last_client_event_id" uuid;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lesson_progress_lesson_id_lessons_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."lesson_progress"
      ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk"
      FOREIGN KEY ("lesson_id")
      REFERENCES "courses"."lessons"("id")
      ON DELETE cascade
      ON UPDATE cascade
      NOT VALID;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lesson_progress_watched_percentage_chk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."lesson_progress"
      ADD CONSTRAINT "lesson_progress_watched_percentage_chk"
      CHECK ("watched_percentage" BETWEEN 0 AND 100)
      NOT VALID;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lesson_progress_last_position_chk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."lesson_progress"
      ADD CONSTRAINT "lesson_progress_last_position_chk"
      CHECK ("last_position" >= 0)
      NOT VALID;
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "progress_user_course_completed_idx"
  ON "courses"."lesson_progress" USING btree ("user_id", "course_id", "completed");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "courses"."course_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "course_id" uuid NOT NULL,
  "status" varchar(32) DEFAULT 'not_started' NOT NULL,
  "completed_lessons" integer DEFAULT 0 NOT NULL,
  "required_lessons" integer DEFAULT 0 NOT NULL,
  "progress_percentage" integer DEFAULT 0 NOT NULL,
  "completed_at" timestamp,
  "certificate_eligible_at" timestamp,
  "last_lesson_id" uuid,
  "last_position" integer DEFAULT 0 NOT NULL,
  "version" integer DEFAULT 0 NOT NULL,
  "curriculum_version" integer DEFAULT 1 NOT NULL,
  "rule_version" varchar(32) DEFAULT 'v1' NOT NULL,
  "completed_by_backfill" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_progress_user_id_user_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."course_progress"
      ADD CONSTRAINT "course_progress_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "app_auth"."user"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_progress_course_id_courses_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."course_progress"
      ADD CONSTRAINT "course_progress_course_id_courses_id_fk"
      FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_progress_percentage_chk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."course_progress"
      ADD CONSTRAINT "course_progress_percentage_chk"
      CHECK ("progress_percentage" BETWEEN 0 AND 100);
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_progress_completed_lessons_chk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."course_progress"
      ADD CONSTRAINT "course_progress_completed_lessons_chk"
      CHECK ("completed_lessons" >= 0);
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_progress_required_lessons_chk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."course_progress"
      ADD CONSTRAINT "course_progress_required_lessons_chk"
      CHECK ("required_lessons" >= 0);
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_progress_last_position_chk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."course_progress"
      ADD CONSTRAINT "course_progress_last_position_chk"
      CHECK ("last_position" >= 0);
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'course_progress_version_chk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."course_progress"
      ADD CONSTRAINT "course_progress_version_chk"
      CHECK ("version" >= 0);
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "course_progress_user_course_uq"
  ON "courses"."course_progress" USING btree ("user_id", "course_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "course_progress_completed_user_course_idx"
  ON "courses"."course_progress" USING btree ("user_id", "course_id")
  WHERE "status" = 'completed';
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "courses"."progress_sync_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_event_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "course_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "event_type" varchar(32) NOT NULL,
  "request_hash" varchar(128) NOT NULL,
  "response_snapshot" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'progress_sync_events_user_id_user_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."progress_sync_events"
      ADD CONSTRAINT "progress_sync_events_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "app_auth"."user"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'progress_sync_events_course_id_courses_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."progress_sync_events"
      ADD CONSTRAINT "progress_sync_events_course_id_courses_id_fk"
      FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "progress_sync_events_user_client_event_uq"
  ON "courses"."progress_sync_events" USING btree ("user_id", "client_event_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "progress_sync_events_created_at_idx"
  ON "courses"."progress_sync_events" USING btree ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "courses"."certificates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "certificate_number" varchar(64) NOT NULL,
  "user_id" text NOT NULL,
  "course_id" uuid NOT NULL,
  "course_progress_id" uuid NOT NULL,
  "issued_at" timestamp DEFAULT now() NOT NULL,
  "revoked_at" timestamp,
  "revocation_reason" text,
  "metadata" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificates_user_id_user_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."certificates"
      ADD CONSTRAINT "certificates_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "app_auth"."user"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificates_course_id_courses_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."certificates"
      ADD CONSTRAINT "certificates_course_id_courses_id_fk"
      FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certificates_course_progress_id_course_progress_id_fk'
      AND connamespace = 'courses'::regnamespace
  ) THEN
    ALTER TABLE "courses"."certificates"
      ADD CONSTRAINT "certificates_course_progress_id_course_progress_id_fk"
      FOREIGN KEY ("course_progress_id") REFERENCES "courses"."course_progress"("id");
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "certificates_number_uq"
  ON "courses"."certificates" USING btree ("certificate_number");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "certificates_user_course_uq"
  ON "courses"."certificates" USING btree ("user_id", "course_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "certificates_course_progress_idx"
  ON "courses"."certificates" USING btree ("course_progress_id");
--> statement-breakpoint

WITH required_lessons AS (
  SELECT
    l.course_id,
    count(*)::integer AS required_lessons
  FROM "courses"."lessons" l
  WHERE l.status = 'active'
    AND l.is_archived = false
  GROUP BY l.course_id
),
valid_progress AS (
  SELECT DISTINCT ON (lp.user_id, lp.course_id, lp.lesson_id)
    lp.user_id,
    lp.course_id,
    lp.lesson_id,
    lp.completed,
    lp.completed_at,
    lp.watched_percentage,
    lp.last_position,
    lp.updated_at
  FROM "courses"."lesson_progress" lp
  JOIN "courses"."lessons" l
    ON l.id = lp.lesson_id
   AND l.course_id = lp.course_id
  WHERE l.status = 'active'
    AND l.is_archived = false
  ORDER BY
    lp.user_id,
    lp.course_id,
    lp.lesson_id,
    lp.completed DESC,
    lp.updated_at DESC
),
aggregate_progress AS (
  SELECT
    vp.user_id,
    vp.course_id,
    count(*) FILTER (WHERE vp.completed = true)::integer AS completed_lessons,
    max(vp.updated_at) AS last_progress_at,
    (array_agg(vp.lesson_id ORDER BY vp.updated_at DESC))[1] AS last_lesson_id,
    (array_agg(vp.last_position ORDER BY vp.updated_at DESC))[1] AS last_position
  FROM valid_progress vp
  GROUP BY vp.user_id, vp.course_id
)
INSERT INTO "courses"."course_progress" (
  "user_id",
  "course_id",
  "status",
  "completed_lessons",
  "required_lessons",
  "progress_percentage",
  "completed_at",
  "certificate_eligible_at",
  "last_lesson_id",
  "last_position",
  "completed_by_backfill",
  "created_at",
  "updated_at"
)
SELECT
  ap.user_id,
  ap.course_id,
  CASE
    WHEN rl.required_lessons > 0
     AND ap.completed_lessons >= rl.required_lessons
    THEN 'completed'
    WHEN ap.completed_lessons > 0 THEN 'in_progress'
    ELSE 'not_started'
  END AS status,
  ap.completed_lessons,
  COALESCE(rl.required_lessons, 0),
  CASE
    WHEN COALESCE(rl.required_lessons, 0) = 0 THEN 0
    ELSE LEAST(100, floor((ap.completed_lessons::numeric / rl.required_lessons) * 100)::integer)
  END AS progress_percentage,
  CASE
    WHEN rl.required_lessons > 0
     AND ap.completed_lessons >= rl.required_lessons
    THEN ap.last_progress_at
    ELSE NULL
  END AS completed_at,
  CASE
    WHEN rl.required_lessons > 0
     AND ap.completed_lessons >= rl.required_lessons
    THEN ap.last_progress_at
    ELSE NULL
  END AS certificate_eligible_at,
  ap.last_lesson_id,
  COALESCE(ap.last_position, 0),
  true,
  now(),
  now()
FROM aggregate_progress ap
LEFT JOIN required_lessons rl ON rl.course_id = ap.course_id
WHERE COALESCE(rl.required_lessons, 0) > 0
ON CONFLICT ("user_id", "course_id") DO NOTHING;
