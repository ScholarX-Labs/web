CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "courses";
--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('pending', 'resolved');--> statement-breakpoint
CREATE TABLE "auth"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"first_name_ar" text,
	"last_name_ar" text,
	"education_level" text,
	"university" text,
	"faculty" text,
	"company" text,
	"school" text,
	"gpa" integer,
	"industry" text,
	"date_of_birth" timestamp,
	"nationality" text,
	"city" text,
	"current_interest" text,
	"saved_opportunities" text[] DEFAULT '{}'::text[],
	"registered_events" text[] DEFAULT '{}'::text[],
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "auth"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_us" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone_number" text,
	"message" text NOT NULL,
	"status" "status_enum" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses"."courses" (
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
CREATE TABLE "courses"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"amount" integer,
	"status" varchar(50),
	"is_active" boolean,
	"payment_id" varchar(255),
	"enrolled_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD CONSTRAINT "courses_instructor_id_user_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."subscriptions" ADD CONSTRAINT "subscriptions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "auth"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "auth"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "auth"."verification" USING btree ("identifier");