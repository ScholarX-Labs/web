# Data Model: Certification Module
**Branch**: `003-certification-module` | **Date**: 2026-04-28

Drizzle ORM schema for a new `certificates` PostgreSQL schema. All tables live in `src/domain/certificates/infrastructure/db/certificates-db.schema.ts` and are registered in `drizzle.config.ts`.

---

## Schema Overview

```
certificates schema
├── certificates          — Core credential record
├── certificate_events    — Immutable audit log
├── certificate_jobs      — Bulk issuance async jobs
└── completion_criteria   — Per-course completion thresholds
```

---

## Entity Definitions

### 1. `certificates.certificates`

One record per issued credential. Uniqueness constraint on `(userId, courseId, seasonNumber)` prevents duplicate issuance.

```typescript
export const dbCertificates = certificatesSchema.table(
  "certificates",
  {
    // Identity
    id: uuid("id").primaryKey().defaultRandom(),
    shortId: varchar("short_id", { length: 20 }).notNull().unique(),
    // e.g. "SX-2026-00142" — generated on insert via sequence

    // Recipient
    userId: text("user_id").references(() => dbUsers.id, { onDelete: "set null" }),
    recipientName: varchar("recipient_name", { length: 255 }).notNull(),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),

    // Program context
    courseId: uuid("course_id").references(() => dbCourses.id).notNull(),
    programName: varchar("program_name", { length: 255 }).notNull(),
    seasonNumber: integer("season_number").notNull(),
    role: varchar("role", { length: 20 }).notNull(), // "mentee" | "mentor"
    completionDate: timestamp("completion_date").notNull(),

    // Lifecycle
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    // Allowed: "PENDING" | "CLAIMED" | "REVOKED" | "FAILED"
    issuedAt: timestamp("issued_at").notNull().defaultNow(),
    claimedAt: timestamp("claimed_at"),
    revokedAt: timestamp("revoked_at"),
    revokedReason: text("revoked_reason"),

    // Cryptographic integrity
    signatureHex: varchar("signature_hex", { length: 64 }).notNull(),
    // HMAC-SHA256 hex string over canonical payload

    // Asset storage
    pdfStorageKey: varchar("pdf_storage_key", { length: 500 }),
    // e.g. "certificates/{id}/cert.pdf"
    pngStorageKey: varchar("png_storage_key", { length: 500 }),
    // e.g. "certificates/{id}/cert.png"

    // Claim token
    claimToken: varchar("claim_token", { length: 64 }).unique(),
    claimTokenExpiresAt: timestamp("claim_token_expires_at"),

    // Portfolio visibility
    isPublic: boolean("is_public").notNull().default(false),

    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Idempotency: one certificate per (user, course, season)
    uniqueIssuance: uniqueIndex("uq_cert_user_course_season").on(
      table.userId,
      table.courseId,
      table.seasonNumber,
    ),
  }),
);
```

**State Machine**:
```
[PENDING] → [CLAIMED]  (recipient claims via token)
[PENDING] → [FAILED]   (generation failed after 3 retries)
[PENDING] → [REVOKED]  (admin revokes before claim)
[CLAIMED] → [REVOKED]  (admin revokes after claim)
[FAILED]  → [PENDING]  (admin manual retry)
```

---

### 2. `certificates.certificate_events`

Immutable append-only audit log. Never updated or deleted.

```typescript
export const dbCertificateEvents = certificatesSchema.table(
  "certificate_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    certificateId: uuid("certificate_id")
      .notNull()
      .references(() => dbCertificates.id),
    eventType: varchar("event_type", { length: 50 }).notNull(),
    // Allowed: "issued" | "claimed" | "viewed" | "verified" | "shared"
    //          | "downloaded" | "revoked" | "email_sent" | "email_resent"
    //          | "generation_failed" | "generation_retried"
    actorId: text("actor_id"),            // userId if authenticated, null for public
    actorRole: varchar("actor_role", { length: 20 }), // "recipient" | "admin" | "public"
    ipRegion: varchar("ip_region", { length: 100 }), // anonymized, e.g. "LK" country code
    userAgentHash: varchar("user_agent_hash", { length: 64 }), // SHA256 of UA string
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  },
);
```

---

### 3. `certificates.certificate_jobs`

Tracks bulk season issuance jobs. Enables async processing and real-time progress polling.

```typescript
export const dbCertificateJobs = certificatesSchema.table(
  "certificate_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").references(() => dbCourses.id).notNull(),
    seasonNumber: integer("season_number").notNull(),
    triggeredBy: text("triggered_by").notNull(), // admin userId
    status: varchar("status", { length: 20 }).notNull().default("PENDING"),
    // Allowed: "PENDING" | "PROCESSING" | "COMPLETED" | "PARTIAL" | "FAILED"
    totalCount: integer("total_count").notNull().default(0),
    processedCount: integer("processed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    errorSummary: jsonb("error_summary").$type<Array<{ userId: string; error: string }>>(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
);
```

---

### 4. `certificates.completion_criteria`

One record per course. Admin-configurable. Must exist before automatic issuance can trigger.

```typescript
export const dbCompletionCriteria = certificatesSchema.table(
  "completion_criteria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .unique()
      .references(() => dbCourses.id),
    minWatchPercentage: integer("min_watch_percentage").notNull().default(90),
    // Range: 0–100. Certificate issued when enrolled user reaches this %.
    quizzesRequired: boolean("quizzes_required").notNull().default(false),
    minQuizScore: integer("min_quiz_score").default(70),
    // Range: 0–100. Null/ignored when quizzesRequired = false.
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);
```

---

### 5. User Entity Extensions (existing `auth.user` table)

The existing `auth.user` table (managed by `better-auth`) needs two new columns for the public portfolio feature. These are added via a Drizzle migration on the `auth` schema:

```typescript
// New columns added to existing auth.user table
portfolioUsername: varchar("portfolio_username", { length: 30 }).unique(),
// Null = no public portfolio configured. Unique across all users.
portfolioEnabled: boolean("portfolio_enabled").notNull().default(false),
// True only when username is set AND user has opted in.
```

> **Note**: These columns are added via a Drizzle migration. The `better-auth` schema file is regenerated and the `auth-schema.ts` in `/src/db/schema/` is updated.

---

## Relationships Diagram

```
auth.user (existing)
  ├─< certificates.certificates (userId FK, nullable — GDPR erasure sets null)
  │     └─< certificates.certificate_events (certificateId FK)
  └── portfolio_username, portfolio_enabled (new columns)

courses.courses (existing)
  ├─< certificates.certificates (courseId FK)
  ├─< certificates.certificate_jobs (courseId FK)
  └──  certificates.completion_criteria (courseId FK, unique — 1:1)
```

---

## Validation Rules

| Field | Rule |
|---|---|
| `certificates.status` | Must be one of: `PENDING`, `CLAIMED`, `REVOKED`, `FAILED` |
| `certificates.role` | Must be one of: `mentee`, `mentor` |
| `certificates.shortId` | Format: `SX-{YYYY}-{5-digit-zero-padded-seq}`, e.g. `SX-2026-00142` |
| `certificates.signatureHex` | 64-character lowercase hex string |
| `certificates.claimToken` | 64-character cryptographically random hex (generated via `crypto.randomBytes(32).toString('hex')`) |
| `completion_criteria.minWatchPercentage` | Integer 0–100 inclusive |
| `completion_criteria.minQuizScore` | Integer 0–100 inclusive, only validated when `quizzesRequired = true` |
| `auth.user.portfolioUsername` | Regex: `/^[a-z0-9-]{3,30}$/` (lowercase alphanumeric + hyphens, 3–30 chars) |

---

## Index Strategy

| Table | Index | Purpose |
|---|---|---|
| `certificates` | `(userId, courseId, seasonNumber)` UNIQUE | Idempotency enforcement |
| `certificates` | `(status)` | Admin dashboard filtering |
| `certificates` | `(claimToken)` UNIQUE | Fast claim token lookup |
| `certificates` | `(courseId, seasonNumber)` | Season-level filtering |
| `certificate_events` | `(certificateId, occurredAt)` | Audit log chronological queries |
| `certificate_jobs` | `(courseId, seasonNumber)` | Bulk job lookup |
| `completion_criteria` | `(courseId)` UNIQUE | Already enforced by FK unique constraint |
| `auth.user` | `(portfolioUsername)` UNIQUE | Fast `/u/:username` resolution |

---

## Drizzle Config Update

Add to `drizzle.config.ts`:
```typescript
schema: [
  "./src/db/schema/auth-schema.ts",
  "./src/db/schema/contact-us-schema.ts",
  "./src/domain/courses/infrastructure/db/courses-db.schema.ts",
  "./src/domain/certificates/infrastructure/db/certificates-db.schema.ts", // NEW
],
schemaFilter: ["auth", "public", "courses", "certificates"], // add "certificates"
```
