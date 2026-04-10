-- Fix courses: convert instructor_id and subscriptions.user_id to text if needed
CREATE SCHEMA IF NOT EXISTS "courses";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'courses'
      AND table_name = 'courses'
      AND column_name = 'instructor_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE "courses"."courses"
      ALTER COLUMN instructor_id TYPE text USING instructor_id::text;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'courses'
      AND table_name = 'subscriptions'
      AND column_name = 'user_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE "courses"."subscriptions"
      ALTER COLUMN user_id TYPE text USING user_id::text;
  END IF;
END
$$;
