CREATE SCHEMA "email";
--> statement-breakpoint
CREATE TABLE "email"."email_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(64) NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"total_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email"."email_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar(180) NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"category" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'queued' NOT NULL,
	"recipient_email" varchar(320) NOT NULL,
	"recipient_hash" varchar(64) NOT NULL,
	"sender_identity" varchar(320) NOT NULL,
	"subject_hash" varchar(64) NOT NULL,
	"subject_preview" varchar(120),
	"body_storage_mode" varchar(32) DEFAULT 'stored' NOT NULL,
	"body_reference" text,
	"text_body" text,
	"html_body" text,
	"reply_to" varchar(320),
	"accepted_provider" varchar(32),
	"provider_message_id" text,
	"failure_category" varchar(64),
	"failure_reason" text,
	"requested_by_user_id" text,
	"requested_by_system" varchar(120),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"next_attempt_at" timestamp,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"locked_by" varchar(120),
	"locked_at" timestamp,
	"locked_until" timestamp,
	"state_version" integer DEFAULT 0 NOT NULL,
	"batch_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"failed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "email"."email_delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"provider" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"provider_message_id" text,
	"failure_category" varchar(64),
	"failure_reason" text,
	"latency_ms" integer
);
--> statement-breakpoint
CREATE TABLE "email"."email_delivery_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"provider" varchar(32),
	"provider_event_id" varchar(255),
	"provider_message_id" text,
	"event_type" varchar(32) NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"received_at" timestamp NOT NULL,
	"reason_category" varchar(64),
	"safe_details" text
);
--> statement-breakpoint
CREATE TABLE "email"."email_provider_circuit_states" (
	"provider" varchar(32) PRIMARY KEY NOT NULL,
	"state" varchar(16) DEFAULT 'closed' NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"opened_at" timestamp,
	"cooldown_until" timestamp,
	"last_failure_category" varchar(64),
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email"."email_rate_limit_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(32) NOT NULL,
	"scope_key_hash" varchar(64) NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_seconds" integer NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email"."email_batches" ADD CONSTRAINT "email_batches_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email"."email_deliveries" ADD CONSTRAINT "email_deliveries_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email"."email_delivery_attempts" ADD CONSTRAINT "email_delivery_attempts_delivery_id_email_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "email"."email_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email"."email_delivery_events" ADD CONSTRAINT "email_delivery_events_delivery_id_email_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "email"."email_deliveries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_deliveries_request_uq" ON "email"."email_deliveries" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_deliveries_idempotency_uq" ON "email"."email_deliveries" USING btree ("category","idempotency_key");--> statement-breakpoint
CREATE INDEX "email_deliveries_retry_claim_idx" ON "email"."email_deliveries" USING btree ("status","next_attempt_at","locked_until");--> statement-breakpoint
CREATE INDEX "email_deliveries_locked_until_idx" ON "email"."email_deliveries" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "email_deliveries_recipient_idx" ON "email"."email_deliveries" USING btree ("recipient_hash","created_at");--> statement-breakpoint
CREATE INDEX "email_deliveries_admin_filter_idx" ON "email"."email_deliveries" USING btree ("category","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_attempts_delivery_number_uq" ON "email"."email_delivery_attempts" USING btree ("delivery_id","attempt_number");--> statement-breakpoint
CREATE UNIQUE INDEX "email_attempts_one_accepted_uq" ON "email"."email_delivery_attempts" USING btree ("delivery_id") WHERE "email"."email_delivery_attempts"."status" = 'accepted';--> statement-breakpoint
CREATE INDEX "email_attempts_delivery_idx" ON "email"."email_delivery_attempts" USING btree ("delivery_id","attempt_number");--> statement-breakpoint
CREATE INDEX "email_events_delivery_idx" ON "email"."email_delivery_events" USING btree ("delivery_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_events_provider_event_uq" ON "email"."email_delivery_events" USING btree ("provider","provider_event_id") WHERE "email"."email_delivery_events"."provider_event_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "email_rate_limit_bucket_uq" ON "email"."email_rate_limit_counters" USING btree ("scope","scope_key_hash","window_start","window_seconds");--> statement-breakpoint
CREATE INDEX "email_rate_limit_expires_idx" ON "email"."email_rate_limit_counters" USING btree ("expires_at");