-- Custom SQL migration file, put your code below! --
ALTER TABLE "user"
ALTER COLUMN "saved_opportunities"
SET DEFAULT '{}'::text [];
ALTER TABLE "user"
ALTER COLUMN "registered_events"
SET DEFAULT '{}'::text [];