ALTER TABLE "courses"."courses" ADD COLUMN IF NOT EXISTS "learning_outcomes" jsonb;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN IF NOT EXISTS "target_audience" jsonb;
