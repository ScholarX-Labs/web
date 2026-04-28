# Data Model: Certification Module

**Branch**: `003-certification-module` | **Date**: 2026-04-28 | **Phase**: 1  
**Source**: spec.md § Key Entities + Assumptions + Functional Requirements

---

## Entity Relationship Overview

```
User ──────────────────────────────────────────────────────┐
 │ (portfolioUsername, portfolioEnabled on existing table)  │
 │                                                          │
 ├──< certificates (userId FK)                              │
 │         │                                                │
 │         ├──< certificate_events (certificateId FK)       │
 │         └── [one] completion_criteria (per courseSlug)   │
 │                                                          │
 └──< bulk_issuance_jobs (triggeredBy FK)                   │
                                                            │
Course (external, no DB table owned here —                  │
        read-only via courseSlug string reference) ─────────┘
```

---

## 1. `completion_criteria` Table

**File**: `src/db/schema/certification-schema.ts`

```ts
export const completionCriteria = pgTable("completion_criteria", {
  id:               uuid("id").defaultRandom().primaryKey(),
  courseSlug:       text("course_slug").notNull().unique(),
  minWatchPct:      integer("min_watch_pct").notNull().default(90),
  quizzesRequired:  boolean("quizzes_required").notNull().default(false),
  minQuizScore:     integer("min_quiz_score"),          // null when quizzesRequired = false
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

**Constraints**:
- `courseSlug` is UNIQUE — one criteria record per course.
- `minWatchPct` in range [0, 100]; validated at the application layer (Zod).
- `minQuizScore` is nullable; must be non-null when `quizzesRequired = true` (Zod refinement).

**Index**: `courseSlug` (for fast lookup when evaluating completion events).

---

## 2. `certificates` Table

**File**: `src/db/schema/certification-schema.ts`

```ts
export const certificateStatusEnum = pgEnum("certificate_status", [
  "PENDING",
  "CLAIMED",
  "REVOKED",
  "FAILED",
]);

export const certificates = pgTable("certificates", {
  id:                   uuid("id").defaultRandom().primaryKey(),
  shortId:              text("short_id").notNull().unique(),         // e.g. "SX-2026-00142"
  courseSlug:           text("course_slug").notNull(),
  courseTitle:          text("course_title").notNull(),
  userId:               text("user_id").notNull()
                          .references(() => user.id, { onDelete: "restrict" }),
  recipientName:        text("recipient_name").notNull(),
  recipientEmail:       text("recipient_email").notNull(),
  role:                 text("role").notNull(),                      // "mentee" | "mentor"
  status:               certificateStatusEnum("status").notNull().default("PENDING"),
  claimToken:           text("claim_token").unique(),
  claimTokenExpiry:     timestamp("claim_token_expiry"),
  claimedAt:            timestamp("claimed_at"),
  pdfUrl:               text("pdf_url"),                             // S3 key
  pngUrl:               text("png_url"),                             // S3 key (1200x630)
  signatureFingerprint: text("signature_fingerprint").notNull(),
  isPublic:             boolean("is_public").notNull().default(false),
  revokedAt:            timestamp("revoked_at"),
  revokedReason:        text("revoked_reason"),
  metadata:             jsonb("metadata"),
  createdAt:            timestamp("created_at").defaultNow().notNull(),
  updatedAt:            timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

**Constraints**:
- UNIQUE on `(courseSlug, userId)` — prevents duplicate certificates per participant per course.
- `shortId` generated as `SX-{YEAR}-{5-digit-seq}` at the service layer.
- `recipientEmail` anonymized to `deleted@scholarx.lk` on GDPR erasure; `recipientName` to `[Redacted]`.
- `claimToken` is set to null after first successful claim (single-use enforcement).

**Indexes**:
- `(courseSlug)` — for bulk issuance queries.
- `(userId)` — for wallet queries.
- `(status)` — for admin dashboard filters.
- `(claimToken)` — for claim-link lookups.

**Lifecycle / Status Transitions**:
```
[issuance] → PENDING
PENDING    → CLAIMED   (on successful claim)
PENDING    → FAILED    (on generation failure after 3 retries)
PENDING    → REVOKED   (admin revoke)
CLAIMED    → REVOKED   (admin revoke)
REVOKED    → CLAIMED   (un-revoke — admin restores)
FAILED     → PENDING   (admin manual retry)
```

---

## 3. `certificate_events` Table

**File**: `src/db/schema/certification-schema.ts`

```ts
export const certificateEventTypeEnum = pgEnum("certificate_event_type", [
  "ISSUED",
  "CLAIMED",
  "VIEWED",
  "VERIFIED",
  "SHARED",
  "DOWNLOADED",
  "REVOKED",
  "EMAIL_SENT",
  "EMAIL_RESENT",
  "FAILED",
]);

export const certificateEvents = pgTable("certificate_events", {
  id:            uuid("id").defaultRandom().primaryKey(),
  certificateId: uuid("certificate_id").notNull()
                   .references(() => certificates.id, { onDelete: "cascade" }),
  eventType:     certificateEventTypeEnum("event_type").notNull(),
  actorId:       text("actor_id"),                // null for public/anonymous events
  ipRegion:      text("ip_region"),               // anonymized (country/region only, no IP)
  userAgent:     text("user_agent"),
  metadata:      jsonb("metadata"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});
```

**Design notes**:
- Append-only. No `updatedAt`. Events are never modified or deleted.
- `actorId` is nullable — verification events by anonymous verifiers have no actor.
- `ipRegion` stores country + region only (GDPR-safe), not the raw IP.

**Index**: `(certificateId)` — for event history queries.

---

## 4. `bulk_issuance_jobs` Table

**File**: `src/db/schema/certification-schema.ts`

```ts
export const bulkJobStatusEnum = pgEnum("bulk_job_status", [
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "PARTIAL",   // completed with some failures
  "FAILED",
]);

export const bulkIssuanceJobs = pgTable("bulk_issuance_jobs", {
  id:              uuid("id").defaultRandom().primaryKey(),
  courseSlug:      text("course_slug").notNull(),
  triggeredBy:     text("triggered_by").notNull()
                     .references(() => user.id, { onDelete: "restrict" }),
  totalCount:      integer("total_count").notNull().default(0),
  processedCount:  integer("processed_count").notNull().default(0),
  failedCount:     integer("failed_count").notNull().default(0),
  status:          bulkJobStatusEnum("status").notNull().default("QUEUED"),
  errorLog:        jsonb("error_log"),            // array of { userId, reason } failure records
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});
```

**Index**: `(courseSlug, status)` — for admin dashboard job listing.

---

## 5. User Table Extensions (Already Applied)

The following columns were already added to the `auth.user` table in `auth-schema.ts`:

```ts
portfolioUsername: text("portfolio_username").unique(),
portfolioEnabled:  boolean("portfolio_enabled").notNull().default(false),
```

No further changes to the `user` table are required.

---

## 6. Zod Validation Schemas (Application Layer)

**File**: `src/domain/certificates/schemas.ts`

```ts
// CompletionCriteria input
export const CompletionCriteriaSchema = z.object({
  courseSlug:      z.string().min(1),
  minWatchPct:     z.number().int().min(0).max(100),
  quizzesRequired: z.boolean(),
  minQuizScore:    z.number().int().min(0).max(100).nullable(),
}).refine(
  (d) => !d.quizzesRequired || d.minQuizScore !== null,
  { message: "minQuizScore is required when quizzesRequired is true" }
);

// Manual issuance
export const IssueCertificateSchema = z.object({
  courseSlug:     z.string().min(1),
  userId:         z.string().min(1),
  recipientName:  z.string().min(1).max(200),
  recipientEmail: z.string().email(),
  role:           z.enum(["mentee", "mentor"]),
});

// Revoke
export const RevokeCertificateSchema = z.object({
  id:     z.string().uuid(),
  reason: z.string().min(1).max(500),
});

// Portfolio username
export const SetPortfolioUsernameSchema = z.object({
  username: z.string()
    .min(3).max(30)
    .regex(/^[a-zA-Z0-9-]+$/, "Only alphanumeric characters and hyphens allowed"),
});
```

---

## 7. TypeScript Domain Types

**File**: `src/domain/certificates/types.ts`

```ts
export type CertificateStatus = "PENDING" | "CLAIMED" | "REVOKED" | "FAILED";
export type CertificateRole   = "mentee" | "mentor";
export type CertificateEventType =
  | "ISSUED" | "CLAIMED" | "VIEWED" | "VERIFIED"
  | "SHARED" | "DOWNLOADED" | "REVOKED" | "EMAIL_SENT" | "EMAIL_RESENT" | "FAILED";

export interface Certificate {
  id:                   string;
  shortId:              string;
  courseSlug:           string;
  courseTitle:          string;
  userId:               string;
  recipientName:        string;
  recipientEmail:       string;
  role:                 CertificateRole;
  status:               CertificateStatus;
  claimToken:           string | null;
  claimTokenExpiry:     Date | null;
  claimedAt:            Date | null;
  pdfUrl:               string | null;  // S3 key
  pngUrl:               string | null;  // S3 key
  signatureFingerprint: string;
  isPublic:             boolean;
  revokedAt:            Date | null;
  revokedReason:        string | null;
  metadata:             Record<string, unknown> | null;
  createdAt:            Date;
  updatedAt:            Date;
}

export interface CompletionCriteria {
  id:              string;
  courseSlug:      string;
  minWatchPct:     number;
  quizzesRequired: boolean;
  minQuizScore:    number | null;
}

export interface CertificateVerificationResult {
  status:               CertificateStatus | "INVALID";
  certificateId:        string;
  shortId:              string;
  recipientName:        string;
  courseTitle:          string;
  courseSlug:           string;
  role:                 CertificateRole;
  issuedAt:             Date;
  claimedAt:            Date | null;
  signatureFingerprint: string;
  signatureValid:       boolean;
  pngUrl:               string | null;  // for OG image (presigned)
}
```
