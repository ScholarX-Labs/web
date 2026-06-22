ALTER TABLE "auth"."user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "github_url" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "facebook_url" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "instagram_url" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "is_profile_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");