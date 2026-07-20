ALTER TABLE "point_events" DROP CONSTRAINT "point_events_idempotency_key_unique";--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "email_verification_skipped" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "courses"."subscriptions_user_course_uq";--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_course_uq" ON "courses"."subscriptions" USING btree ("user_id","course_id") WHERE "courses"."subscriptions"."is_active" = true;