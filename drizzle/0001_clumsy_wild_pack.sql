CREATE TABLE "courses"."inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"message" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"source_surface" varchar(50),
	"idempotency_key" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses"."lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lesson_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"watched_percentage" integer DEFAULT 0 NOT NULL,
	"last_position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" text NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(255),
	"before" jsonb,
	"after" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses"."lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"content" text,
	"video_url" varchar(500),
	"duration" integer,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"is_private" boolean DEFAULT true,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "sales_inquiry" boolean;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "is_archived" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "seo_keywords" varchar(500);--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "courses"."inquiries" ADD CONSTRAINT "inquiries_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."inquiries" ADD CONSTRAINT "inquiries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."lesson_progress" ADD CONSTRAINT "lesson_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."lessons" ADD CONSTRAINT "lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inquiries_course_user_idempotency_uq" ON "courses"."inquiries" USING btree ("course_id","user_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "inquiries_course_user_status_idx" ON "courses"."inquiries" USING btree ("course_id","user_id","status");--> statement-breakpoint
CREATE INDEX "inquiries_created_at_idx" ON "courses"."inquiries" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_lesson_uq" ON "courses"."lesson_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "progress_course_user_idx" ON "courses"."lesson_progress" USING btree ("course_id","user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_action_idx" ON "auth"."admin_audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "admin_audit_log_entity_idx" ON "auth"."admin_audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_admin_idx" ON "auth"."admin_audit_log" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_audit_log_created_at_idx" ON "auth"."admin_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lessons_course_id_idx" ON "courses"."lessons" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "lessons_sort_idx" ON "courses"."lessons" USING btree ("course_id","sort_index");--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD CONSTRAINT "courses_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "courses"."lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "courses"."lessons"("id") ON DELETE cascade ON UPDATE cascade;