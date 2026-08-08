-- Step 2: Only run AFTER backfill verification
-- Verify: SELECT COUNT(*) FROM app_auth.user WHERE username IS NULL;
-- If 0, proceed:
ALTER TABLE app_auth.user ALTER COLUMN username SET NOT NULL;
