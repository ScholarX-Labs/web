import {
  pgSchema,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user as dbUsers } from "@/db/schema/auth-schema";
import { dbCourses } from "@/domain/courses/infrastructure/db/courses-db.schema";

export const certificatesSchema = pgSchema("certificates");

// ---------------------------------------------------------------------------
// certificates.certificates
// ---------------------------------------------------------------------------

export const dbCertificates = certificatesSchema.table(
  "certificates",
  {
    // Identity
    id: uuid("id").primaryKey().defaultRandom(),
    shortId: varchar("short_id", { length: 20 }).notNull().unique(),

    // Recipient
    userId: text("user_id").references(() => dbUsers.id, {
      onDelete: "set null",
    }),
    recipientName: varchar("recipient_name", { length: 255 }).notNull(),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),

    // Program context
    courseId: uuid("course_id")
      .references(() => dbCourses.id)
      .notNull(),
    programName: varchar("program_name", { length: 255 }).notNull(),
    seasonNumber: integer("season_number").notNull(),
    role: varchar("role", { length: 20 }).notNull(), // "mentee" | "mentor"
    completionDate: timestamp("completion_date").notNull(),

    // Lifecycle
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    // "PENDING" | "CLAIMED" | "REVOKED" | "FAILED"
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    claimedAt: timestamp("claimed_at"),
    revokedAt: timestamp("revoked_at"),
    revokedReason: text("revoked_reason"),

    // Cryptographic integrity
    signatureHex: varchar("signature_hex", { length: 64 }).notNull(),

    // Asset storage
    pdfStorageKey: varchar("pdf_storage_key", { length: 500 }),
    pngStorageKey: varchar("png_storage_key", { length: 500 }),

    // Claim token
    claimToken: varchar("claim_token", { length: 64 }).unique(),
    claimTokenExpiresAt: timestamp("claim_token_expires_at"),

    // Portfolio visibility
    isPublic: boolean("is_public").notNull().default(false),

    // Audit
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_cert_user_course_season").on(
      table.userId,
      table.courseId,
      table.seasonNumber,
    ),
  ],
);

// ---------------------------------------------------------------------------
// certificates.certificate_events  (immutable audit log)
// ---------------------------------------------------------------------------

export const dbCertificateEvents = certificatesSchema.table(
  "certificate_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    certificateId: uuid("certificate_id")
      .notNull()
      .references(() => dbCertificates.id),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    // "issued" | "claimed" | "viewed" | "verified" | "shared"
    // "downloaded" | "revoked" | "email_sent" | "email_resent"
    // "generation_failed" | "generation_retried"
    actorId: text("actor_id"),
    actorRole: varchar("actor_role", { length: 20 }),
    ipRegion: varchar("ip_region", { length: 100 }),
    userAgentHash: varchar("user_agent_hash", { length: 64 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  },
);

// ---------------------------------------------------------------------------
// certificates.certificate_jobs  (bulk issuance async jobs)
// ---------------------------------------------------------------------------

export const dbCertificateJobs = certificatesSchema.table("certificate_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .references(() => dbCourses.id)
    .notNull(),
  seasonNumber: integer("season_number").notNull(),
  triggeredBy: text("triggered_by").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  // "PENDING" | "PROCESSING" | "COMPLETED" | "PARTIAL" | "FAILED"
  totalCount: integer("total_count").notNull().default(0),
  processedCount: integer("processed_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  errorSummary:
    jsonb("error_summary").$type<Array<{ userId: string; error: string }>>(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// certificates.completion_criteria  (per-course completion thresholds)
// ---------------------------------------------------------------------------

export const dbCompletionCriteria = certificatesSchema.table(
  "completion_criteria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .unique()
      .references(() => dbCourses.id),
    minWatchPercentage: integer("min_watch_percentage").notNull().default(90),
    quizzesRequired: boolean("quizzes_required").notNull().default(false),
    minQuizScore: integer("min_quiz_score").default(70),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);
