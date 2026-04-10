CREATE SCHEMA IF NOT EXISTS "courses";

CREATE TABLE IF NOT EXISTS "courses"."courses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"slug" varchar(255),
	"title" varchar(100) NOT NULL,
	"description" varchar(2000) NOT NULL,
	"image_url" varchar(1000),
	"video_preview_url" varchar(1000),
	"category" varchar(50) NOT NULL,
	"level" varchar(50),
	"current_price" integer NOT NULL,
	"original_price" integer,
	"instructor_id" text,
	"status" varchar(50) NOT NULL,
	"rating" numeric(3, 2),
	"total_ratings" integer,
	"duration" varchar(100),
	"lessons_count" integer,
	"videos_count" integer,
	"students_count" integer,
	"is_bestseller" boolean,
	"urgency_text" varchar(255),
	"tags" jsonb,
	"requires_form" boolean,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"amount" integer,
	"status" varchar(50),
	"is_active" boolean,
	"payment_id" varchar(255),
	"enrolled_at" timestamp
);
