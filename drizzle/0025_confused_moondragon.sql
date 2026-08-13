ALTER TYPE "public"."activity_type" ADD VALUE 'lesson_task';--> statement-breakpoint
CREATE TABLE "courses"."lesson_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"type" varchar(16) NOT NULL,
	"title" varchar(255) NOT NULL,
	"instructions" text,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"is_optional" boolean DEFAULT true NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"config" jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_tasks_points_chk" CHECK ("courses"."lesson_tasks"."points_awarded" >= 0)
);
--> statement-breakpoint
CREATE TABLE "courses"."task_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"task_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"task_snapshot" jsonb NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_submissions_points_chk" CHECK ("courses"."task_submissions"."points_earned" >= 0)
);
--> statement-breakpoint
ALTER TABLE "courses"."lesson_tasks" ADD CONSTRAINT "lesson_tasks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "courses"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."lesson_tasks" ADD CONSTRAINT "lesson_tasks_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "app_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."lesson_tasks" ADD CONSTRAINT "lesson_tasks_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "app_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."task_submissions" ADD CONSTRAINT "task_submissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."task_submissions" ADD CONSTRAINT "task_submissions_task_id_lesson_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "courses"."lesson_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."task_submissions" ADD CONSTRAINT "task_submissions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_tasks_lesson_sort_uq" ON "courses"."lesson_tasks" USING btree ("lesson_id","sort_index");--> statement-breakpoint
CREATE INDEX "lesson_tasks_lesson_status_idx" ON "courses"."lesson_tasks" USING btree ("lesson_id","status","sort_index");--> statement-breakpoint
CREATE UNIQUE INDEX "task_submissions_user_task_uq" ON "courses"."task_submissions" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_submissions_user_client_event_uq" ON "courses"."task_submissions" USING btree ("user_id","client_event_id");--> statement-breakpoint
CREATE INDEX "task_submissions_task_status_idx" ON "courses"."task_submissions" USING btree ("task_id","status");