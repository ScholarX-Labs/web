-- Step 1: Add profile columns as NULLABLE (safe for existing rows)
ALTER TABLE auth.user
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS is_profile_public boolean DEFAULT true;

-- Create unique index on non-null usernames (supports partial NULLs during backfill)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_username ON auth.user (username) WHERE username IS NOT NULL;

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp DEFAULT NOW() NOT NULL,
  updated_by text
);

-- Seed default config
INSERT INTO app_config (key, value, updated_by)
VALUES ('avatar_upload_enabled', 'true', 'system:migration')
ON CONFLICT (key) DO NOTHING;
