CREATE SCHEMA "certificates";
--> statement-breakpoint
CREATE TABLE "courses"."certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_number" varchar(64) NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"course_progress_id" uuid NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revocation_reason" text,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	CONSTRAINT "course_applications_age_chk" CHECK ("courses"."course_applications"."age" between 10 and 100),
	CONSTRAINT "course_applications_years_of_experience_chk" CHECK ("courses"."course_applications"."years_of_experience" is null or "courses"."course_applications"."years_of_experience" >= 0)
);
--> statement-breakpoint
CREATE TABLE "courses"."course_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"icon_key" varchar(50) DEFAULT 'tag' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses"."course_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"status" varchar(32) DEFAULT 'not_started' NOT NULL,
	"completed_lessons" integer DEFAULT 0 NOT NULL,
	"required_lessons" integer DEFAULT 0 NOT NULL,
	"progress_percentage" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"certificate_eligible_at" timestamp,
	"last_lesson_id" uuid,
	"last_position" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"curriculum_version" integer DEFAULT 1 NOT NULL,
	"rule_version" varchar(32) DEFAULT 'v1' NOT NULL,
	"completed_by_backfill" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "course_progress_percentage_chk" CHECK ("courses"."course_progress"."progress_percentage" BETWEEN 0 AND 100),
	CONSTRAINT "course_progress_completed_lessons_chk" CHECK ("courses"."course_progress"."completed_lessons" >= 0),
	CONSTRAINT "course_progress_required_lessons_chk" CHECK ("courses"."course_progress"."required_lessons" >= 0),
	CONSTRAINT "course_progress_last_position_chk" CHECK ("courses"."course_progress"."last_position" >= 0),
	CONSTRAINT "course_progress_version_chk" CHECK ("courses"."course_progress"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "courses"."progress_sync_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"course_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"request_hash" varchar(128) NOT NULL,
	"response_snapshot" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates"."certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_number" varchar(64) NOT NULL,
	"short_id" varchar(64),
	"user_id" text NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"recipient_email" varchar(255),
	"source_type" varchar(32) DEFAULT 'course_completion' NOT NULL,
	"source_id" uuid,
	"course_id" uuid,
	"course_progress_id" uuid,
	"program_name" varchar(255) NOT NULL,
	"completion_date" timestamp NOT NULL,
	"status" varchar(16) DEFAULT 'issued' NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	"revoked_at" timestamp,
	"revoked_reason" text,
	"revoked_by" text,
	"signature_hex" text,
	"claim_token" varchar(255),
	"claim_token_expires_at" timestamp,
	"pdf_storage_key" text,
	"png_storage_key" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rule_version" varchar(32) DEFAULT 'course_completion_v1' NOT NULL,
	"completion_source" varchar(32) DEFAULT 'live' NOT NULL,
	"season_number" integer,
	"role" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates"."certificate_artifact_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_id" uuid NOT NULL,
	"certificate_id" uuid NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"queue_name" varchar(128) DEFAULT 'certificate-artifact-generation' NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"published_at" timestamp,
	"next_attempt_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates"."certificate_artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_id" uuid NOT NULL,
	"artifact_type" varchar(16) DEFAULT 'pdf' NOT NULL,
	"template_version" varchar(64) DEFAULT 'scholarx-v1' NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"storage_provider" varchar(32) DEFAULT 'azure_blob' NOT NULL,
	"storage_container" varchar(128),
	"storage_key" text,
	"content_type" varchar(64),
	"byte_size" bigint,
	"checksum_sha256" varchar(64),
	"error_code" varchar(64),
	"error_message" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp,
	"generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates"."certificate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_id" uuid NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"actor_id" text,
	"actor_role" varchar(32),
	"ip_region" varchar(32),
	"user_agent_hash" varchar(64),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "curriculum_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "required_lessons_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "certificate_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "courses"."courses" ADD COLUMN "auto_approve_applications" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courses"."lesson_progress" ADD COLUMN "last_client_event_id" uuid;--> statement-breakpoint
ALTER TABLE "courses"."certificates" ADD CONSTRAINT "certificates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."certificates" ADD CONSTRAINT "certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."certificates" ADD CONSTRAINT "certificates_course_progress_id_course_progress_id_fk" FOREIGN KEY ("course_progress_id") REFERENCES "courses"."course_progress"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."course_applications" ADD CONSTRAINT "course_applications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."course_applications" ADD CONSTRAINT "course_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."course_applications" ADD CONSTRAINT "course_applications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."course_progress" ADD CONSTRAINT "course_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."course_progress" ADD CONSTRAINT "course_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."progress_sync_events" ADD CONSTRAINT "progress_sync_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses"."progress_sync_events" ADD CONSTRAINT "progress_sync_events_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates"."certificates" ADD CONSTRAINT "certificates_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates"."certificates" ADD CONSTRAINT "certificates_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates"."certificate_artifact_queue" ADD CONSTRAINT "certificate_artifact_queue_artifact_id_certificate_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "certificates"."certificate_artifacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates"."certificate_artifact_queue" ADD CONSTRAINT "certificate_artifact_queue_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "certificates"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates"."certificate_artifacts" ADD CONSTRAINT "certificate_artifacts_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "certificates"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates"."certificate_events" ADD CONSTRAINT "certificate_events_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "certificates"."certificates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_number_uq" ON "courses"."certificates" USING btree ("certificate_number");--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_user_course_uq" ON "courses"."certificates" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "certificates_course_progress_idx" ON "courses"."certificates" USING btree ("course_progress_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_applications_active_user_course_uq" ON "courses"."course_applications" USING btree ("course_id","user_id") WHERE "courses"."course_applications"."status" in ('pending','reviewing','approved','waitlisted');--> statement-breakpoint
CREATE INDEX "course_applications_user_course_idx" ON "courses"."course_applications" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "course_applications_course_status_submitted_idx" ON "courses"."course_applications" USING btree ("course_id","status","submitted_at");--> statement-breakpoint
CREATE INDEX "course_applications_status_submitted_idx" ON "courses"."course_applications" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX "course_applications_learner_status_submitted_idx" ON "courses"."course_applications" USING btree ("learner_status","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "course_applications_user_course_idempotency_uq" ON "courses"."course_applications" USING btree ("user_id","course_id","idempotency_key") WHERE "courses"."course_applications"."idempotency_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "course_categories_name_uq" ON "courses"."course_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "course_categories_slug_uq" ON "courses"."course_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "course_categories_active_sort_idx" ON "courses"."course_categories" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "course_progress_user_course_uq" ON "courses"."course_progress" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "course_progress_completed_user_course_idx" ON "courses"."course_progress" USING btree ("user_id","course_id") WHERE "courses"."course_progress"."status" = 'completed';--> statement-breakpoint
CREATE UNIQUE INDEX "progress_sync_events_user_client_event_uq" ON "courses"."progress_sync_events" USING btree ("user_id","client_event_id");--> statement-breakpoint
CREATE INDEX "progress_sync_events_created_at_idx" ON "courses"."progress_sync_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "certs_certificate_number_uq" ON "certificates"."certificates" USING btree ("certificate_number");--> statement-breakpoint
CREATE UNIQUE INDEX "certs_source_uq" ON "certificates"."certificates" USING btree ("user_id","source_type","source_id") WHERE "certificates"."certificates"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "certs_public_lookup_idx" ON "certificates"."certificates" USING btree ("certificate_number","status") WHERE "certificates"."certificates"."is_public" = true;--> statement-breakpoint
CREATE INDEX "certs_user_idx" ON "certificates"."certificates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cert_artifact_queue_message_id_uq" ON "certificates"."certificate_artifact_queue" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "cert_artifact_queue_repair_idx" ON "certificates"."certificate_artifact_queue" USING btree ("status","published_at","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cert_artifacts_cert_type_version_uq" ON "certificates"."certificate_artifacts" USING btree ("certificate_id","artifact_type","template_version");--> statement-breakpoint
CREATE INDEX "cert_artifacts_status_idx" ON "certificates"."certificate_artifacts" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "cert_events_certificate_idx" ON "certificates"."certificate_events" USING btree ("certificate_id","occurred_at");--> statement-breakpoint
CREATE INDEX "cert_events_type_occurred_idx" ON "certificates"."certificate_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "progress_user_course_completed_idx" ON "courses"."lesson_progress" USING btree ("user_id","course_id","completed");--> statement-breakpoint
ALTER TABLE "courses"."lesson_progress" ADD CONSTRAINT "lesson_progress_watched_percentage_chk" CHECK ("courses"."lesson_progress"."watched_percentage" BETWEEN 0 AND 100);--> statement-breakpoint
ALTER TABLE "courses"."lesson_progress" ADD CONSTRAINT "lesson_progress_last_position_chk" CHECK ("courses"."lesson_progress"."last_position" >= 0);