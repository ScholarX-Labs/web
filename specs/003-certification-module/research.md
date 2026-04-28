# Research: Certification Module

**Branch**: `003-certification-module` | **Date**: 2026-04-28 | **Phase**: 0

---

## 1. Watch-Percentage Completion via Telemetry

**Decision**: The existing `useLessonProgress` hook already implements furthest-timestamp tracking (`watchedPercentage = max(prev, currentTimestamp / duration * 100)`). The `COMPLETE_AT_PCT` constant (currently `90`) can be promoted to a per-course configurable value read from `CompletionCriteria`. No new telemetry infrastructure is required.

**Rationale**: The hook fires every 500ms via VidStack's `onTimeUpdate` and persists to `localStorage`. The completion effect at line 306–318 already fires `completedAt` when the threshold is crossed. We need to:
1. Replace the hardcoded `90` constant with a value passed from the course's `CompletionCriteria`.
2. Add a callback prop (`onCompleted?: () => void`) to `useLessonProgress` that fires once when `completedAt` is first set.
3. Surface that callback in `LessonClientBridge` to trigger the celebration modal and the certificate-issuance Server Action.

**Alternatives considered**: Segment-based tracking (rejected — spec clarification Q2 chose furthest-timestamp, simpler).

---

## 2. Database Schema — New Tables

**Decision**: Four new Drizzle ORM tables in `src/db/schema/certification-schema.ts`, in the shared `public` PostgreSQL schema (consistent with the project pattern of `auth` schema for auth tables).

| Table | Key Fields | Notes |
|-------|-----------|-------|
| `completion_criteria` | `id`, `courseSlug` (FK/unique), `minWatchPct` (int), `quizzesRequired` (bool), `minQuizScore` (int nullable) | One row per course |
| `certificates` | `id` (UUID), `shortId` (text unique), `courseSlug`, `userId` (FK), `status` (enum), `claimToken`, `claimTokenExpiry`, `claimedAt`, `pdfUrl`, `pngUrl`, `signatureFingerprint`, `isPublic` (bool default false), `metadata` (jsonb), timestamps | Core entity |
| `certificate_events` | `id`, `certificateId` (FK), `eventType` (enum), `actorId` (FK nullable), `ipRegion`, `userAgent`, `metadata` (jsonb), `createdAt` | Immutable audit; append-only |
| `bulk_issuance_jobs` | `id`, `courseSlug`, `triggeredBy`, `totalCount`, `processedCount`, `failedCount`, `status`, `createdAt`, `updatedAt` | Lightweight DB-backed async job |

**Rationale**: The project uses Drizzle ORM + PostgreSQL. Keeping all certification tables in the same database and schema avoids cross-service complexity. The `user` table already has `portfolioUsername` and `portfolioEnabled` fields added.

**Alternatives considered**: Separate service/database (rejected — spec clarification Q2 mandated embedded module, shared DB).

---

## 3. Certificate Generation — PDF + PNG

**Decision**: Use `@react-pdf/renderer` (already installed) for PDF generation via a Server Action. Generate PNG by rendering the certificate template to a React tree, then using `html-to-image` or a Canvas-based approach for the 1200×630 share image.

**Rationale**: `@react-pdf/renderer` is already in `package.json`. It produces pixel-perfect A4 PDFs server-side. For PNG, `html-to-image` (to be added) converts a React component tree to a PNG without a headless browser, keeping the stack lightweight.

**Alternatives considered**: Puppeteer (rejected — too heavy for a shared deployment; requires headless Chrome binary; spec constrains to embedded module without extra infra). Vercel OG image API (considered for PNG only — viable but harder to customize with brand assets).

---

## 4. Certificate Signing (Cryptographic Integrity)

**Decision**: Use Node.js built-in `crypto` module (available in Next.js server context). Sign a canonical JSON payload with HMAC-SHA256 using a server-side secret (`CERTIFICATE_SIGNING_SECRET` env var). Store the hex digest as `signatureFingerprint`.

**Rationale**: The project is a Next.js monolith without AWS KMS. HMAC-SHA256 with a strong server secret provides tamper-detection for V2 scope. The signing secret is kept in environment variables (already a project convention per `.env.example`). Key rotation can be addressed in a future milestone.

**Alternatives considered**: RSA-2048 / AWS KMS (rejected — too complex for V2 embedded module; no AWS infra confirmed).

---

## 5. File Storage — PDF/PNG Assets

**Decision**: Upload generated PDFs and PNGs to AWS S3 using `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` (already installed). Serve downloads via 15-minute presigned URLs. Public verification page embeds the PNG via presigned URL for OG image.

**Rationale**: Both `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` are already in `package.json`. S3 bucket and credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION`) will be added to `.env.example`.

**Alternatives considered**: Vercel Blob / Cloudflare R2 (viable, but S3 SDK is already installed).

---

## 6. Email Delivery

**Decision**: Use `nodemailer` (already installed) with an SMTP transactional provider (Resend SMTP or SendGrid SMTP). Email templates are React components rendered to HTML strings via `@react-email/render` (to be added as a lightweight dependency).

**Rationale**: `nodemailer` is already in `package.json`. React Email provides typed, preview-able email templates consistent with the project's React-first approach.

**Alternatives considered**: Resend REST API (simpler but adds a new HTTP client dependency; SMTP keeps nodemailer as the single email adapter).

---

## 7. Celebration Modal — In-App Completion UX

**Decision**: Add a `useCertificateCompletion` hook that subscribes to the `onCompleted` callback from `useLessonProgress`. When fired, it:
1. Sets a local state flag to show a `CelebrationModal` component over the video player.
2. Calls the `POST /api/certificates` Server Action to trigger synchronous certificate issuance.
3. Displays the certificate URL in the modal once the action resolves.

**Implementation note**: The modal uses `framer-motion` + `canvas-confetti` (both already installed) for the celebration animation. It renders as a portal over the lesson layout.

---

## 8. Bulk Issuance — DB-Backed Job Pattern

**Decision**: Create a `bulk_issuance_jobs` table. The admin triggers bulk issue → API route creates a job record → a Next.js Route Handler processes certificates one-by-one in a `while` loop using `setInterval` polling on the client for progress. No Redis/BullMQ required.

**Rationale**: Spec clarification mandated no external queue. The database-backed job pattern (insert job → process in background → poll for status) is sufficient for the scale of a ScholarX season (typically 50–500 participants).

---

## 9. Public Routes — Verification & Portfolio Pages

**Decision**: 
- `/verify/[id]` — already scaffolded in `src/app/verify/[id]/page.tsx`. Upgrade to a full Server Component with proper data fetching, OG meta tags, and cryptographic verification logic.  
- `/u/[username]/certificates` — already scaffolded in `src/app/u/`. Implement as a fully public Server Component with `noindex` control.
- `/certificates/claim/[token]` — already scaffolded under `src/app/certificates/claim/`. Complete the claim flow.

**Rationale**: The route scaffolding already exists from previous work; this is a completion task.

---

## 10. API Routes — Existing vs. New

**Decision**: The `src/app/api/certificates/` directory already exists with subdirectories: `bulk/`, `claim/`, `jobs/`, `portfolio/`, `verify/`, and `route.ts`. These are already scaffolded. The plan will fill in the implementation of each route handler.

---

## 11. Testing Strategy

**Decision**: Use Node's built-in test runner (`node --import tsx --test`) already configured in `package.json`. Write unit tests for:
- Certificate signing/verification logic (pure functions, easy to test)
- `useLessonProgress` completion threshold logic
- Server Actions (integration tests using in-memory test DB)

**Rationale**: The project already uses `tsx` + Node test runner. No additional test framework to install.

---

## Summary of New Dependencies to Install

| Package | Purpose | Action |
|---------|---------|--------|
| `html-to-image` | PNG generation from React component | `pnpm add html-to-image` |
| `@react-email/render` | Email template rendering | `pnpm add @react-email/render` |

All other dependencies are already present in `package.json`.
