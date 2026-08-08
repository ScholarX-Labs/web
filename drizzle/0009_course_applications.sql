CREATE TABLE "courses"."course_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "course_id" uuid NOT NULL,
  "user_id" text NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "age" integer NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(50) NOT NULL,
  "learner_status" varchar(32) NOT NULL,
  "high_school_name" varchar(255),
  "university" varchar(255),
  "faculty" varchar(255),
  "graduation_year" integer,
  "work_field" varchar(255),
  "years_of_experience" integer,
  "personal_statement" text NOT NULL,
  "learning_goals" text NOT NULL,
  "background" text NOT NULL,
  "form_version" varchar(32) DEFAULT 'v1' NOT NULL,
  "extra_answers" jsonb,
  "source_surface" varchar(50),
  "idempotency_key" varchar(255),
  "submitted_at" timestamp DEFAULT now() NOT NULL,
  "reviewed_at" timestamp,
  "reviewed_by" text,
  "review_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "course_applications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "course_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "app_auth"."user"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "course_applications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "app_auth"."user"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "course_applications_age_chk" CHECK ("courses"."course_applications"."age" between 10 and 100),
  CONSTRAINT "course_applications_years_of_experience_chk" CHECK ("courses"."course_applications"."years_of_experience" is null or "courses"."course_applications"."years_of_experience" >= 0)
);

CREATE UNIQUE INDEX "course_applications_active_user_course_uq"
ON "courses"."course_applications" ("course_id","user_id")
WHERE "status" in ('pending','reviewing','approved','waitlisted');

CREATE INDEX "course_applications_user_course_idx"
ON "courses"."course_applications" ("user_id","course_id");

CREATE INDEX "course_applications_course_status_submitted_idx"
ON "courses"."course_applications" ("course_id","status","submitted_at");

CREATE INDEX "course_applications_status_submitted_idx"
ON "courses"."course_applications" ("status","submitted_at");

CREATE INDEX "course_applications_learner_status_submitted_idx"
ON "courses"."course_applications" ("learner_status","submitted_at");

CREATE UNIQUE INDEX "course_applications_user_course_idempotency_uq"
ON "courses"."course_applications" ("user_id","course_id","idempotency_key")
WHERE "idempotency_key" is not null;
