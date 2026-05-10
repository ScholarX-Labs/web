-- Rollback Step 2
ALTER TABLE auth.user ALTER COLUMN username DROP NOT NULL;
