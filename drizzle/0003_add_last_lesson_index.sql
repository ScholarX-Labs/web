ALTER TABLE "courses"."courses" ADD COLUMN "last_lesson_index" integer NOT NULL DEFAULT 0;

UPDATE "courses"."courses" c
SET "last_lesson_index" = COALESCE(
  (SELECT MAX(l.sort_index) FROM "courses"."lessons" l WHERE l.course_id = c.id),
  0
);
