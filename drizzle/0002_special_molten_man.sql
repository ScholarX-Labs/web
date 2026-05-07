UPDATE "courses"."course_completions" 
SET "completion_percentage" = LEAST(GREATEST("completion_percentage", 0), 100),
    "completed_lessons" = GREATEST("completed_lessons", 0);
--> statement-breakpoint
ALTER TABLE "courses"."course_completions" ADD CONSTRAINT "completion_percentage_range" CHECK ("courses"."course_completions"."completion_percentage" >= 0 AND "courses"."course_completions"."completion_percentage" <= 100);--> statement-breakpoint
ALTER TABLE "courses"."course_completions" ADD CONSTRAINT "completed_lessons_non_negative" CHECK ("courses"."course_completions"."completed_lessons" >= 0);