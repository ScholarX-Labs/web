-- Rollback Step 1
DROP INDEX IF EXISTS app_auth.idx_user_username;
ALTER TABLE app_auth.user
  DROP COLUMN IF EXISTS username,
  DROP COLUMN IF EXISTS github_url,
  DROP COLUMN IF EXISTS facebook_url,
  DROP COLUMN IF EXISTS instagram_url,
  DROP COLUMN IF EXISTS twitter_url,
  DROP COLUMN IF EXISTS linkedin_url,
  DROP COLUMN IF EXISTS is_profile_public;
DROP TABLE IF EXISTS app_config;
