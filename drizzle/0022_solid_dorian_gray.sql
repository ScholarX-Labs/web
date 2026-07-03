CREATE TYPE "public"."activity_type" AS ENUM('quiz', 'exam', 'forum_post', 'assignment_submit', 'lesson_completion', 'course_completion');--> statement-breakpoint
CREATE TABLE "leaderboard_opt_outs" (
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_opt_outs_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "point_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"activity_id" uuid,
	"points" integer NOT NULL,
	"idempotency_key" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "point_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "leaderboard_opt_outs" ADD CONSTRAINT "leaderboard_opt_outs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_opt_outs" ADD CONSTRAINT "leaderboard_opt_outs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_events" ADD CONSTRAINT "point_events_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pe_course_window_idx" ON "point_events" USING btree ("course_id","created_at","user_id","activity_type");--> statement-breakpoint
CREATE INDEX "pe_user_course_idx" ON "point_events" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pe_idempotency_key_idx" ON "point_events" USING btree ("idempotency_key");