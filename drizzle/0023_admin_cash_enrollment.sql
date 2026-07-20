ALTER TABLE "auth"."user" ADD COLUMN "must_change_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courses"."subscriptions" ADD COLUMN "payment_method" varchar(50);--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_course_uq" ON "courses"."subscriptions" ("user_id","course_id");
