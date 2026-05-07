CREATE TABLE "courses"."course_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"certificate_id" varchar(60) NOT NULL,
	"completion_percentage" integer DEFAULT 0 NOT NULL,
	"completed_lessons" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "course_completions_certificate_id_unique" UNIQUE("certificate_id")
);
--> statement-breakpoint
ALTER TABLE "courses"."course_completions" ADD CONSTRAINT "course_completions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."course_completions" ADD CONSTRAINT "course_completions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_completions_user_course_uidx" ON "courses"."course_completions" USING btree ("user_id","course_id");