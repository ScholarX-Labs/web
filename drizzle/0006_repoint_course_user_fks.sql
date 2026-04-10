-- Repoint courses.* foreign keys from public.users -> auth.user and convert column types to text
CREATE SCHEMA IF NOT EXISTS "courses";

-- Drop existing FK constraints that reference public.users
ALTER TABLE IF EXISTS "courses"."subscriptions" DROP CONSTRAINT IF EXISTS subscriptions_user_id_users_id_fk;
ALTER TABLE IF EXISTS "courses"."courses" DROP CONSTRAINT IF EXISTS courses_instructor_id_users_id_fk;

-- Convert column types if needed (safe DO block)
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

-- Add constraints pointing to auth.user (add NOT VALID to avoid immediate validation failures)
ALTER TABLE IF EXISTS "courses"."courses"
  ADD CONSTRAINT IF NOT EXISTS courses_instructor_id_auth_user_id_fk
  FOREIGN KEY (instructor_id) REFERENCES auth."user"(id) NOT VALID;

ALTER TABLE IF EXISTS "courses"."subscriptions"
  ADD CONSTRAINT IF NOT EXISTS subscriptions_user_id_auth_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth."user"(id) ON DELETE CASCADE NOT VALID;
