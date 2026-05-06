# Implementation Plan: Migrate Certificates & Change Password

**Branch**: `003-migrate-certificates-password`  
**Date**: 2026-05-06  
**Author**: Principal Full-Stack Engineer  
**Stack**: Next.js **16.1.6** App Router · React 19.2.3 · Drizzle ORM · PostgreSQL · better-auth · pdf-lib · TypeScript 5.x

---

## Objective

Migrate three legacy features from the Express/React (MongoDB) stack to the Next.js V2 project:

1. **My Certificates** — authenticated page listing completed courses with downloadable PDF certificates.
2. **Certificate Verification** — public, SSR-rendered page for third-party authenticity checks.
3. **Change Password** — authenticated settings page using `better-auth`'s secure `changePassword` API.
4. **Completion Write Path** — service method + integration point that creates a `course_completions` row when a learner reaches 100%, so new certificates are generated continuously after launch.

**Data migration from MongoDB → PostgreSQL is in scope** and must run before this feature ships to production. All historical `CourseCompletion` documents will be migrated into `courses.course_completions`. After migration, the V2 system is the single source of truth — no dual-lookup, no MongoDB dependency.

---

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Language | TypeScript 5.x — strict mode, no `any` | Type safety at every layer |
| Package Manager | **pnpm** | Existing project standard (`pnpm-lock.yaml`) |
| Runtime | Next.js **16.1.6** App Router (Node.js runtime for route handlers) | Actual installed version — React 19.2.3 |
| Database | PostgreSQL via Drizzle ORM — existing `pgSchema("courses")` | Single source of truth post-migration |
| Auth | `better-auth` — `auth.api.getSession({ headers })` pattern | Matches all existing protected routes |
| PDF | `pdf-lib` — buffer-based, returns `Buffer` only | Must `pnpm add pdf-lib` — not yet in package.json |
| Template asset | **`public/certificate-template.svg`** — convert to PDF at build or use `pdf-lib` + SVG-to-PDF lib | `certificate-template.svg` already exists; no PDF present |
| Certificate ID | `CERT-${randomUUID().toUpperCase()}` — Node built-in `crypto` | No external dep; UUID v4 collision-proof |
| Legacy cert IDs | **Dropped** — only `CERT-<UUID>` format supported | Post-migration, legacy format does not exist |
| Data fetching | **Server Actions only** — no TanStack Query, no SWR | All cert data needed at SSR time; zero client bundle cost |
| Post-password-change | Inline success state → `router.push("/settings")` after 2s | Clear confirmation before navigation |
| Styling | Tailwind CSS v4 + shadcn/ui + sonner (already installed) | Matches V2 design system |
| params type | **`Promise<{ ... }>`** + `await params` — Next 16 convention | See `src/app/(platform)/courses/[slug]/page.tsx` pattern |

---

## Constitution Gate

*All items verified against project conventions before implementation begins.*

| Principle | Status | Notes |
|---|---|---|
| I. SOLID / Architecture | ✅ PASS | Repository → Service → Action → Page; each layer has one responsibility |
| II. Type Safety | ✅ PASS | All DTOs fully typed in `contracts/`; no `any`; Drizzle `$inferSelect` used for DB types |
| III. Domain Isolation | ✅ PASS | `domain/certificates/` mirrors `domain/courses/` structure exactly |
| IV. Security | ✅ PASS | `currentPassword` required for change-password; auth session validated in every protected path |
| V. Performance | ✅ PASS | Verify page is pure RSC (zero client JS); PDF served via streaming `Response`; template cached in memory |

---

## Part 2 — Project Structure

```text
src/
│
├── domain/certificates/                          ← NEW DOMAIN (mirrors domain/courses/)
│   ├── contracts/
│   │   └── index.ts                              [NEW] DTOs: UserCertificateDto, CertificateVerificationResult, CertificatePdfData
│   ├── application/
│   │   ├── certificate.errors.ts                 [NEW] NextCertificateError class
│   │   ├── certificate.service.ts                [NEW] Business logic, Drizzle-native, no Mongoose
│   │   ├── certificate.mappers.ts                [NEW] DB row → DTO mapping helpers
│   │   └── completion-writer.service.ts          [NEW] Idempotent command — upsertCourseCompletion()
│   ├── factory/
│   │   └── next-certificate-domain.factory.ts    [NEW] Composition root for repository + services
│   └── infrastructure/
│       └── db/
│           └── next-certificates.repository.ts   [NEW] Drizzle queries against dbCourseCompletions
│
├── domain/courses/infrastructure/db/
│   └── courses-db.schema.ts                      [MODIFY] Add dbCourseCompletions table
│
├── actions/
│   └── certificates.actions.ts                   [NEW] getUserCertificates(), verifyCertificate()
│
├── app/
│   ├── api/certificates/[courseId]/download/
│   │   └── route.ts                              [NEW] GET — streams PDF, auth-protected
│   │
│   ├── (platform)/                               ← CORRECT group — mirrors existing (platform)/courses
│   │   ├── certificates/
│   │   │   └── page.tsx                          [NEW] My Certificates RSC + Client modal island
│   │   └── settings/change-password/
│   │       └── page.tsx                          [NEW] Change Password Client Component form
│   │
│   └── certificates/verify/[certificateId]/      ← PUBLIC — outside (platform); must also be in proxy OPEN_ROUTES
│       └── page.tsx                              [NEW] Public verify — pure RSC + generateMetadata
│
├── components/certificates/
│   ├── certificate-card.tsx                      [NEW] Single certificate card (Client Component)
│   ├── certificate-modal.tsx                     [NEW] PDF preview modal (Client Component)
│   └── certificate-verify-result.tsx             [NEW] Verification result UI (pure TSX, no hooks)
│
├── proxy.ts                                      [MODIFY] Add /certificates/verify/ to OPEN_ROUTES prefix check
│
└── public/
    ├── certificate-template.svg                  [EXISTS] SVG source — convert to PDF via pdf-lib at build
    └── assets/certificate-template.pdf           [GENERATE] Output of svg→pdf conversion (or place manually)
```

> **Architectural Rule**: The `domain/` layer has zero Next.js imports. It is pure TypeScript — no `headers()`, no `"use server"`, no `next/*`. That boundary is enforced strictly. Server Actions in `src/actions/` are the only bridge.

---

## Design Patterns & Maintainability Rules

This feature should be implemented as a small bounded context, not as page-local database code. The goal is to make certificate issuance, verification, PDF generation, and password changes easy to evolve independently.

| Pattern | Where Applied | Rule |
|---|---|---|
| **Clean / Hexagonal Architecture** | `domain/certificates/*` | Pages, Server Actions, and route handlers are adapters. Domain services own business rules. Repository owns persistence. |
| **Repository Pattern** | `NextCertificatesRepository` | All Drizzle SQL lives in repository methods. No SQL in pages, Server Actions, route handlers, or React components. |
| **Application Service Pattern** | `NextCertificateService`, `CompletionWriterService` | Use-case methods coordinate repository calls and enforce invariants. Services return DTOs or primitives, not React or `Response`. |
| **Composition Root / Factory** | `createNextCertificateDomain()` | Construct repositories and services in one factory, mirroring `createNextCourseDomain()`. Adapters import the factory instead of `new`ing dependencies repeatedly. |
| **DTO + Mapper Pattern** | `contracts/index.ts`, `certificate.mappers.ts` | Convert DB rows to serializable DTOs once. Dates cross RSC/action boundaries as ISO strings only. |
| **Result Object Pattern** | `CertificateVerificationResult` | Public verification returns a typed result instead of throwing for expected invalid/not-found states. |
| **Idempotent Command Pattern** | `upsertCourseCompletion()` | Completion issuance is a command with exactly-once semantics per `(userId, courseId)`. Replays must not mint a second certificate. |
| **Immutable Identifier Pattern** | `certificateId` | Once issued, a certificate ID is never updated. Corrections should update display metadata, not the certificate identity. |
| **Thin Adapter Pattern** | Server Actions and route handlers | Adapters only parse framework inputs, enforce auth, call domain services, and shape HTTP/RSC output. |
| **Client Island Pattern** | Certificate modal and change-password form | Keep certificate listing and verification as RSC. Use client components only for local UI state or browser-only APIs. |
| **Policy Boundary** | Password validation, certificate ID validation | Validation rules live close to the use case and are testable without rendering pages. |

### Dependency Direction

```text
app/*, actions/*, api/*, components/*
        ↓
domain/certificates/application
        ↓
domain/certificates/infrastructure/db
        ↓
db/schema
```

Rules:
- Dependencies point inward from adapters to domain use cases. Domain code never imports `next/*`, `react`, `headers()`, `cookies()`, or UI components.
- `application/` may depend on `contracts/` and repository interfaces/classes, but not on page paths or route handlers.
- `infrastructure/db/` may import Drizzle schema and `db`; it should not return DTOs shaped for UI.
- `components/` consume DTOs only. They do not know Drizzle table names, SQL column names, or auth session shape.

### Domain Factory

Add a factory so actions and route handlers use one stable composition API:

```typescript
// src/domain/certificates/factory/next-certificate-domain.factory.ts
import { NextCertificateService } from "@/domain/certificates/application/certificate.service";
import { CompletionWriterService } from "@/domain/certificates/application/completion-writer.service";
import { NextCertificatesRepository } from "@/domain/certificates/infrastructure/db/next-certificates.repository";

export interface NextCertificateDomainServices {
  certificates: NextCertificateService;
  completions: CompletionWriterService;
}

export const createNextCertificateDomain = (): NextCertificateDomainServices => {
  const repository = new NextCertificatesRepository();

  return {
    certificates: new NextCertificateService(repository),
    completions: new CompletionWriterService(repository),
  };
};
```

### Mapper Boundary

Add explicit mappers instead of inline mapping inside services when row shape starts to grow:

```typescript
// src/domain/certificates/application/certificate.mappers.ts
import type { UserCertificateDto, CertificateVerificationResult } from "../contracts";
import type {
  CertificateUserRow,
  CertificateVerificationRow,
} from "../infrastructure/db/next-certificates.repository";

export function toUserCertificateDto(row: CertificateUserRow): UserCertificateDto {
  return {
    completionId: row.completion.id,
    courseId: row.completion.courseId,
    courseTitle: row.courseTitle,
    courseImageUrl: row.courseImageUrl,
    completedAt: row.completion.completedAt.toISOString(),
    completedLessons: row.completion.completedLessons,
    completionPercentage: row.completion.completionPercentage,
    certificateId: row.completion.certificateId!,
  };
}

export function toValidVerificationResult(row: CertificateVerificationRow): CertificateVerificationResult {
  return {
    valid: true,
    certificateId: row.completion.certificateId!,
    studentName: row.studentName,
    courseName: row.courseTitle,
    completedAt: row.completion.completedAt.toISOString(),
    completionPercentage: row.completion.completionPercentage,
  };
}
```

Define `CertificateUserRow` and `CertificateVerificationRow` as exported repository return types so mapper signatures stay precise.

### Scalability Rules

- Add new certificate read models through repository methods and DTO mappers, not by widening page-specific query code.
- Add new delivery formats, such as PNG preview or share image, as separate application services. Do not grow `buildPdf()` into a multi-format renderer.
- Keep certificate issuance synchronous only while it is cheap. If PDF generation, email delivery, or LinkedIn sharing becomes part of issuance, emit/store the completion first and move side effects behind a queue/job boundary.
- Use database uniqueness as the final correctness guard. Service-level checks improve UX, but `(user_id, course_id)` and `certificate_id` constraints enforce integrity under race conditions.
- Keep public verification cacheable only after product/legal approval. Until then, prefer `dynamic = "force-dynamic"` or conservative cache headers because certificate revocation may be added later.
- Treat `certificateId` as public but unguessable. Never expose internal completion IDs in public verification URLs.

---

## Step 0 — Prerequisites (Do First)

### 0a. Install `pdf-lib`

`pdf-lib` is **not in `package.json`**. Install it before any other step:

```bash
pnpm add pdf-lib
```

Verify the template asset is in place — `public/certificate-template.svg` exists. The service will rasterize it via `pdf-lib` or you can export a static PDF to `public/assets/certificate-template.pdf` first. The simplest approach:

> **Decision**: Export `certificate-template.svg` → `certificate-template.pdf` using Inkscape, Figma, or Adobe. Place the result at `public/assets/certificate-template.pdf`. The service reads this PDF at runtime via `process.cwd()`.  
> If the file is missing at startup, the `getTemplateBytes()` call throws — that is intentional and fails clearly.

### 0b. Fix `proxy.ts` — Make Verify Route Public

**File**: `src/proxy.ts`  
**Action**: Add `/certificates/verify/` to the prefix check in `isPublicRoute`.

```typescript
// BEFORE (line 41-42):
const isPublicRoute =
  OPEN_ROUTES.has(pathname) || pathname.startsWith("/courses/");

// AFTER:
const isPublicRoute =
  OPEN_ROUTES.has(pathname) ||
  pathname.startsWith("/courses/") ||
  pathname.startsWith("/certificates/verify/"); // ← P0 FIX: verify is public
```

> **Why this matters**: Without this, unauthenticated users (employers, LinkedIn visitors clicking a shared cert link) get redirected to `/auth/sign-in`. This would make the verification page completely useless for its primary use case.

---

## Step 1 — Database Schema

**File**: `src/domain/courses/infrastructure/db/courses-db.schema.ts`  
**Action**: ADD `dbCourseCompletions` table to the existing `coursesSchema`.

> **Why here?** `CourseCompletion` is a fact *about* a course enrollment. It belongs to the same `courses` Postgres schema and the same migration boundary as `dbCourses` and `dbSubscriptions`. A new schema file would split a single domain across two migration owners.

```typescript
// ADD after the dbSubscriptions export — same file, same pgSchema("courses")
// Also add `uniqueIndex` to the pg-core import list.

export const dbCourseCompletions = coursesSchema.table(
  "course_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => dbUsers.id, { onDelete: "cascade" }),

    courseId: uuid("course_id")
      .notNull()
      .references(() => dbCourses.id, { onDelete: "cascade" }),

    // ISO timestamp — set once when course is marked 100% complete
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Format: CERT-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (UUID v4 with CERT- prefix)
    // Unique globally because verification uses this as the public lookup key.
    certificateId: varchar("certificate_id", { length: 60 }).notNull().unique(),

    completionPercentage: integer("completion_percentage").notNull().default(0),
    completedLessons: integer("completed_lessons").notNull().default(0),
  },
  (table) => [
    // Final correctness guard for migration reruns and race conditions.
    uniqueIndex("course_completions_user_course_uidx").on(
      table.userId,
      table.courseId,
    ),
  ],
);
```

**After editing the schema file, run:**

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Verify the migration with:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'courses'
  AND table_name   = 'course_completions';
```

---

## Step 2 — Contracts (DTOs) & Error Class

### 2a. `src/domain/certificates/contracts/index.ts` [NEW]

```typescript
/** Returned by getUserCertificates() Server Action */
export interface UserCertificateDto {
  completionId: string;
  courseId: string;
  courseTitle: string;
  courseImageUrl: string | null;
  completedAt: string;        // ISO 8601 — safe to serialize across RSC boundary
  completedLessons: number;
  completionPercentage: number;
  certificateId: string;
}

/** Returned by verifyCertificate() Server Action */
export interface CertificateVerificationResult {
  valid: boolean;
  certificateId: string;
  studentName?: string;       // only present when valid === true
  courseName?: string;
  completedAt?: string;
  completionPercentage?: number;
}

/** Internal — passed to the PDF builder only */
export interface CertificatePdfData {
  studentName: string;
  courseName: string;
  completedAt: Date;
  certificateId: string;
  completionPercentage: number;
  verificationUrl: string;
}
```

### 2b. `src/domain/certificates/application/certificate.errors.ts` [NEW]

```typescript
// Mirrors next-course.errors.ts exactly — same class shape, numeric code space 8xxx
export class NextCertificateError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly numericCode = 8000,
  ) {
    super(message);
    this.name = "NextCertificateError";
  }
}

export const isNextCertificateError = (v: unknown): v is NextCertificateError =>
  v instanceof NextCertificateError;
```

---

## Step 3 — Repository

**File**: `src/domain/certificates/infrastructure/db/next-certificates.repository.ts` [NEW]

> Handles all Drizzle queries. Returns raw DB records only — mapping to DTOs is the service's job.

```typescript
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  dbCourseCompletions,
  dbCourses,
  dbUsers,
} from "@/domain/courses/infrastructure/db/courses-db.schema";

export type CertificateUserRow = Awaited<
  ReturnType<NextCertificatesRepository["findByUser"]>
>[number];

export type CertificateVerificationRow = NonNullable<
  Awaited<ReturnType<NextCertificatesRepository["findByCertificateId"]>>
>;

export class NextCertificatesRepository {
  /**
   * All completions for a user, newest first.
   * Joins dbCourses + dbUsers so the service gets full data in one query.
   */
  async findByUser(userId: string) {
    return db
      .select({
        completion: dbCourseCompletions,
        courseTitle: dbCourses.title,
        courseImageUrl: dbCourses.imageUrl,
        studentName: dbUsers.name,
      })
      .from(dbCourseCompletions)
      .innerJoin(dbCourses, eq(dbCourseCompletions.courseId, dbCourses.id))
      .innerJoin(dbUsers, eq(dbCourseCompletions.userId, dbUsers.id))
      .where(eq(dbCourseCompletions.userId, userId))
      .orderBy(desc(dbCourseCompletions.completedAt));
  }

  /**
   * Single completion by certificateId — used for public verification.
   * No auth required; certificateId is the only lookup key.
   */
  async findByCertificateId(certificateId: string) {
    const rows = await db
      .select({
        completion: dbCourseCompletions,
        courseTitle: dbCourses.title,
        studentName: dbUsers.name,
      })
      .from(dbCourseCompletions)
      .innerJoin(dbCourses, eq(dbCourseCompletions.courseId, dbCourses.id))
      .innerJoin(dbUsers, eq(dbCourseCompletions.userId, dbUsers.id))
      .where(eq(dbCourseCompletions.certificateId, certificateId.toUpperCase()))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Single completion by userId + courseId — used by the PDF download route.
   * Validates ownership: the authenticated user must own this certificate.
   */
  async findByUserAndCourse(userId: string, courseId: string) {
    const rows = await db
      .select({
        completion: dbCourseCompletions,
        courseTitle: dbCourses.title,
        studentName: dbUsers.name,
      })
      .from(dbCourseCompletions)
      .innerJoin(dbCourses, eq(dbCourseCompletions.courseId, dbCourses.id))
      .innerJoin(dbUsers, eq(dbCourseCompletions.userId, dbUsers.id))
      .where(
        and(
          eq(dbCourseCompletions.userId, userId),
          eq(dbCourseCompletions.courseId, courseId),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }
}
```

---

## Step 4 — Certificate Service

**File**: `src/domain/certificates/application/certificate.service.ts` [NEW]

> Business logic only. Depends on repository and `process.cwd()` for the PDF template path. Zero Next.js imports.

```typescript
import { join } from "path";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextCertificatesRepository } from "../infrastructure/db/next-certificates.repository";
import {
  UserCertificateDto,
  CertificateVerificationResult,
  CertificatePdfData,
} from "../contracts";
import {
  toUserCertificateDto,
  toValidVerificationResult,
} from "./certificate.mappers";

// Certificate ID regex — V2 format only: CERT-<UUID v4>
// Legacy format (CERT-XXXXX-XXXXX) is NOT supported here.
// All historical MongoDB certificates must be migrated to this format first
// via the data-migration script (see specs/003-migrate-certificates-password/migration.md).
const CERT_ID_REGEX =
  /^CERT-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

const FRONTEND_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://scholar-x.org";

/** Template bytes cached in memory after first disk read */
let _templateCache: Uint8Array | null = null;

function getTemplateBytes(): Uint8Array {
  if (!_templateCache) {
    const templatePath = join(
      process.cwd(),
      "public/assets/certificate-template.pdf",
    );
    _templateCache = readFileSync(templatePath);
  }
  return _templateCache;
}

export class NextCertificateService {
  constructor(private readonly repo: NextCertificatesRepository) {}

  /** Generate a new unique certificateId */
  generateCertificateId(): string {
    return `CERT-${randomUUID().toUpperCase()}`;
  }

  /** All certificates for an authenticated user */
  async getUserCertificates(userId: string): Promise<UserCertificateDto[]> {
    const rows = await this.repo.findByUser(userId);
    return rows
      .filter((r) => r.completion.certificateId !== null)
      .map(toUserCertificateDto);
  }

  /** Public certificate verification — three distinct result states */
  async verifyCertificate(
    certificateId: string,
  ): Promise<CertificateVerificationResult> {
    // 1. Fast-fail on invalid format — no DB hit
    if (!CERT_ID_REGEX.test(certificateId)) {
      return { valid: false, certificateId };
    }

    // 2. DB lookup
    const row = await this.repo.findByCertificateId(certificateId);
    if (!row) {
      return { valid: false, certificateId };
    }

    // 3. Valid
    return toValidVerificationResult(row);
  }

  /**
   * Generate PDF for an authenticated user's certificate.
   * Returns null if the user has no completed certificate for this course.
   */
  async generatePdf(userId: string, courseId: string): Promise<Buffer | null> {
    const row = await this.repo.findByUserAndCourse(userId, courseId);
    if (!row || !row.completion.certificateId) return null;

    const data: CertificatePdfData = {
      studentName: row.studentName,
      courseName: row.courseTitle,
      completedAt: row.completion.completedAt,
      certificateId: row.completion.certificateId,
      completionPercentage: row.completion.completionPercentage,
      verificationUrl: `${FRONTEND_URL}/certificates/verify/${row.completion.certificateId}`,
    };

    return this.buildPdf(data);
  }

  /** Build PDF bytes from template + dynamic text overlays */
  private async buildPdf(data: CertificatePdfData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(getTemplateBytes());
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Student name — centered, prominent
    const nameSize = 28;
    const nameW = bold.widthOfTextAtSize(data.studentName, nameSize);
    page.drawText(data.studentName, {
      x: (width - nameW) / 2,
      y: height * 0.5,
      size: nameSize,
      font: bold,
      color: rgb(0.353, 0.361, 0.42),
    });

    // Completion date
    const dateStr = new Date(data.completedAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    const dateW = regular.widthOfTextAtSize(dateStr, 10);
    page.drawText(dateStr, {
      x: (width - dateW) / 2 + 26,
      y: height * 0.14,
      size: 10,
      font: regular,
      color: rgb(0.451, 0.451, 0.451),
    });

    // Certificate ID
    const certText = `Certificate ID: ${data.certificateId}`;
    const certW = regular.widthOfTextAtSize(certText, 8);
    page.drawText(certText, {
      x: (width - certW) / 2,
      y: height * 0.07,
      size: 8,
      font: regular,
      color: rgb(0.627, 0.627, 0.627),
    });

    return Buffer.from(await pdfDoc.save());
  }
}
```

---

## Step 5 — Server Actions

**File**: `src/actions/certificates.actions.ts` [NEW]

> The only Next.js-aware layer. Reads the session, calls the service, returns serializable data.

```typescript
"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createNextCertificateDomain } from "@/domain/certificates/factory/next-certificate-domain.factory";

/**
 * Returns all certificates for the currently authenticated user.
 * Call directly from Server Components — no API round-trip needed.
 */
export async function getUserCertificates() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];
  return createNextCertificateDomain().certificates.getUserCertificates(
    session.user.id,
  );
}

/**
 * Public verification — no auth required.
 * Returns a structured result with valid/invalid state and certificate details.
 */
export async function verifyCertificate(certificateId: string) {
  return createNextCertificateDomain().certificates.verifyCertificate(
    certificateId,
  );
}
```

---

## Step 5a — Completion Write Path (New V2 Completions)

**File**: `src/domain/certificates/application/completion-writer.service.ts` [NEW]

> Solves F3: Without this, certificates stagnate after migration. Every time a learner finishes a course in V2, this service must be called to create the `course_completions` row — exactly once per (userId, courseId) pair.

```typescript
import { randomUUID }               from "crypto";
import { NextCertificatesRepository } from "../infrastructure/db/next-certificates.repository";

export class CompletionWriterService {
  constructor(private readonly repo: NextCertificatesRepository) {}

  /**
   * Called by the lesson progress system when a learner hits 100%.
   * Idempotent: a second call for the same (userId, courseId) is a no-op.
   *
   * @returns The certificateId (new or existing)
   */
  async upsertCourseCompletion(
    userId: string,
    courseId: string,
    stats: { completedLessons: number; completionPercentage: number },
  ): Promise<string> {
    // Check for existing completion — do not overwrite a certificate already issued
    const existing = await this.repo.findByUserAndCourse(userId, courseId);
    if (existing?.completion.certificateId) {
      return existing.completion.certificateId;
    }

    // Generate cert ID once — immutable after this point
    const certificateId = `CERT-${randomUUID().toUpperCase()}`;

    await this.repo.upsertCompletion({
      userId,
      courseId,
      certificateId,
      completedLessons: stats.completedLessons,
      completionPercentage: stats.completionPercentage,
    });

    return certificateId;
  }
}
```

**Repository method to add** (`next-certificates.repository.ts`):

```typescript
async upsertCompletion(data: {
  userId: string;
  courseId: string;
  certificateId: string;
  completedLessons: number;
  completionPercentage: number;
}) {
  await db
    .insert(dbCourseCompletions)
    .values({
      ...data,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      // Unique constraint: one completion per (userId, courseId)
      target: [dbCourseCompletions.userId, dbCourseCompletions.courseId],
      set: {
        completedLessons: data.completedLessons,
        completionPercentage: data.completionPercentage,
        // certificateId is NOT updated — once issued, it never changes
      },
    });
}
```

**Integration point** — wherever the lesson progress system marks a course as 100% complete, call:

```typescript
// e.g. inside an existing lesson-progress server action or API route
await createNextCertificateDomain().completions.upsertCourseCompletion(
  userId,
  courseId,
  {
    completedLessons: totalCompleted,
    completionPercentage: 100,
  },
);
```

> **Schema change required**: Add a compound unique constraint `(user_id, course_id)` to `dbCourseCompletions`. See Step 1 — the schema must include `.unique()` on the pair, not just on `certificateId`.

---

## Step 6 — PDF Download Route Handler

**File**: `src/app/api/certificates/[courseId]/download/route.ts` [NEW]

> Returns a binary `Response` — the only correct pattern in Next.js App Router.  
> **Do not** use `Writable` streams, `res.pipe()`, or `res.send()`.

```typescript
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createNextCertificateDomain } from "@/domain/certificates/factory/next-certificate-domain.factory";

// Next 16: params is a Promise
export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  // 1. Auth gate — protect from unauthenticated access
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Generate PDF (service validates ownership via userId+courseId pair)
  const { courseId } = await params;
  const pdfBuffer = await createNextCertificateDomain()
    .certificates
    .generatePdf(session.user.id, courseId);

  if (!pdfBuffer) {
    return new Response("Certificate not found", { status: 404 });
  }

  // 3. Return binary response — browser will trigger download
  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificate-${courseId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
```

**Frontend download button — zero JavaScript required:**

```tsx
// In certificate-card.tsx — just a plain anchor tag
<a
  href={`/api/certificates/${cert.courseId}/download`}
  download={`ScholarX-Certificate-${cert.courseId}.pdf`}
  className="btn-primary"
>
  Download PDF
</a>
```

---

## Step 7 — My Certificates Page (Protected RSC)

**File**: `src/app/(platform)/certificates/page.tsx` [NEW]

> Pure Server Component. No `useEffect`, no client-side fetching. `CertificateModal` is the only Client island.

```tsx
import { Suspense } from "react";
import { getUserCertificates } from "@/actions/certificates.actions";
import { CertificateCard } from "@/components/certificates/certificate-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Certificates | ScholarX",
  description: "View and download your ScholarX course completion certificates.",
};

export default async function CertificatesPage() {
  const certificates = await getUserCertificates();

  return (
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
        <p className="mt-2 text-muted-foreground">
          Congratulations on completing your courses. Your achievements are
          listed below.
        </p>
      </header>

      {certificates.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <CertificateCard key={cert.completionId} certificate={cert} />
          ))}
        </div>
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-24 text-center">
      <span className="text-5xl">🏆</span>
      <h2 className="mt-4 text-xl font-semibold">No Certificates Yet</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Complete your first course to earn your first certificate.
      </p>
      <a href="/courses" className="mt-6 btn-primary">
        Browse Courses
      </a>
    </div>
  );
}
```

---

## Step 8 — Public Certificate Verify Page (Pure RSC + SEO)

**File**: `src/app/certificates/verify/[certificateId]/page.tsx` [NEW]

> No `"use client"`. Server-rendered at request time. Generates dynamic OG metadata for LinkedIn sharing.

```tsx
import type { Metadata } from "next";
import { verifyCertificate } from "@/actions/certificates.actions";

// Next 16 — params is a Promise; must await before use
interface Props {
  params: Promise<{ certificateId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certificateId } = await params;
  const result = await verifyCertificate(certificateId);
  if (result.valid) {
    return {
      title: `Verified Certificate — ${result.studentName} | ScholarX`,
      description: `${result.studentName} successfully completed "${result.courseName}" on ScholarX.`,
    };
  }
  return {
    title: "Certificate Verification | ScholarX",
    description: "Verify the authenticity of a ScholarX certificate.",
  };
}

export default async function CertificateVerifyPage({ params }: Props) {
  const { certificateId } = await params; // ← Next 16 pattern
  const result = await verifyCertificate(certificateId);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        {result.valid ? <ValidResult result={result} /> : <InvalidResult certificateId={certificateId} />}
        <footer className="mt-8 flex justify-center gap-6 text-sm text-muted-foreground">
          <a href="/">Visit ScholarX</a>
          <a href="/courses">Browse Courses</a>
        </footer>
      </div>
    </main>
  );
}

function ValidResult({ result }: { result: Awaited<ReturnType<typeof verifyCertificate>> }) {
  return (
    <>
      <div className="flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-green-700">
        <span className="text-xl">✓</span>
        <span className="font-semibold uppercase tracking-widest text-sm">Verified</span>
      </div>
      <h1 className="mt-5 text-2xl font-bold">Certificate is Valid</h1>
      <p className="mt-1 text-muted-foreground">
        This certificate was issued by ScholarX and is authentic.
      </p>
      <dl className="mt-6 divide-y rounded-lg border text-sm">
        {[
          ["Certificate ID", result.certificateId],
          ["Recipient", result.studentName],
          ["Course", result.courseName],
          ["Completed", result.completedAt ? new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"],
          ["Completion Rate", `${result.completionPercentage}%`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-3">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function InvalidResult({ certificateId }: { certificateId: string }) {
  return (
    <>
      <div className="flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-red-700">
        <span className="text-xl">✕</span>
        <span className="font-semibold uppercase tracking-widest text-sm">Not Found</span>
      </div>
      <h1 className="mt-5 text-2xl font-bold">Certificate Not Found</h1>
      <p className="mt-2 text-muted-foreground">
        No certificate with ID <strong>{certificateId}</strong> was found.
        Please double-check the link and try again.
      </p>
    </>
  );
}
```

---

## Step 9 — Change Password Page

**File**: `src/app/(platform)/settings/change-password/page.tsx` [NEW]

> `"use client"` — this is a form with controlled inputs and async submission. Uses `better-auth`'s `authClient.changePassword()` directly. No custom API endpoint needed.

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must differ from your current password.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true, // Security best practice — sign out other devices
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to change password. Please try again.");
        return;
      }

      setSuccess(true);
      // Redirect to settings after a short confirmation window
      setTimeout(() => router.push("/settings"), 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">✅</div>
          <h2 className="mt-4 text-xl font-semibold">Password Changed</h2>
          <p className="mt-2 text-muted-foreground">
            You have been signed out of all other sessions. Redirecting…
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">Change Password</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input w-full"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="newPassword" className="text-sm font-medium">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input w-full"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Changing…" : "Change Password"}
        </button>
      </form>
    </main>
  );
}
```

---

## Verification Checklist

*All items must pass before the feature is considered complete.*

### Database
- [ ] `npx drizzle-kit generate` produces a clean migration with `course_completions` table
- [ ] `npx drizzle-kit push` applies successfully to local dev DB
- [ ] SQL query confirms all columns exist with correct types and constraints
- [ ] `UNIQUE` constraint on `certificate_id` is present
- [ ] Compound unique index on `(user_id, course_id)` is present

### Architecture / Design Patterns
- [ ] No `next/*`, React, `headers()`, or `"use server"` imports exist under `src/domain/certificates/`
- [ ] Server Actions and route handlers use `createNextCertificateDomain()` instead of constructing repositories directly
- [ ] All Drizzle queries for certificates live in `NextCertificatesRepository`
- [ ] DB rows are converted to public DTOs through mapper helpers, not inside pages/components
- [ ] Re-running completion issuance for the same `(userId, courseId)` returns the existing certificate ID
- [ ] Public verification invalid/not-found states return `CertificateVerificationResult` objects and do not throw expected-control-flow errors

### PDF Generation
- [ ] `certificate-template.pdf` copied to `public/assets/` and committed
- [ ] PDF download returns `200` with `Content-Type: application/pdf` for a valid completion
- [ ] PDF download returns `401` for unauthenticated request
- [ ] PDF download returns `404` when user has no completion for that course
- [ ] PDF contains student name, date, and certificate ID overlaid correctly

### Certificate Verification (3 distinct states)
- [ ] **Valid**: `CERT-<UUID>` that exists in DB → 200 with full details, green badge
- [ ] **Invalid format**: random string → instant return, no DB query, shows "Not Found"
- [ ] **Valid format, not found**: `CERT-<UUID>` not in DB → shows "Not Found" gracefully
- [ ] `generateMetadata` produces correct `title` and `description` for LinkedIn OG scraper

### My Certificates Page
- [ ] Page renders with RSC (no `useEffect` in page.tsx)
- [ ] Empty state renders when `certificates.length === 0`
- [ ] Each card shows: course title, completion date, completion percentage, lessons count
- [ ] "Download PDF" anchor triggers browser download via `/api/certificates/[courseId]/download`

### Change Password
- [ ] Form rejects password shorter than 8 characters with client error
- [ ] Form rejects mismatched passwords with client error
- [ ] Form rejects same current/new password with client error
- [ ] Wrong `currentPassword` → `better-auth` error message displayed in alert
- [ ] Correct submission → success state shown → redirect to `/settings` after 2s
- [ ] Other sessions are revoked (`revokeOtherSessions: true`)

### TypeScript
```bash
npx tsc --noEmit   # Must produce zero errors
```

---

*Plan authored by Principal Full-Stack Engineer. Implementation order: Steps 0 → 1 → 2 → 3 → 4 → 5 → 5a → 6 → 7 → 8 → 9. Each step is independently reviewable via PR diff.*
