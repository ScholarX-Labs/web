-- Custom SQL migration file, put your code below! --
ALTER TABLE "auth"."user"
ALTER COLUMN "saved_opportunities"
SET DEFAULT '{}'::text [];
ALTER TABLE "auth"."user"
ALTER COLUMN "registered_events"
SET DEFAULT '{}'::text [];