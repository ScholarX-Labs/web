-- Rollback Step 2
ALTER TABLE app_auth.user ALTER COLUMN username DROP NOT NULL;
