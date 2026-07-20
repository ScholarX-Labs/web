ALTER TABLE "point_events" DROP CONSTRAINT "point_events_idempotency_key_unique";--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "email_verification_skipped" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courses"."subscriptions" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_course_uq" ON "courses"."subscriptions" USING btree ("user_id","course_id") WHERE "courses"."subscriptions"."is_active" = true;