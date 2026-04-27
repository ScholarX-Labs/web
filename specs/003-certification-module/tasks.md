# Tasks: Certification Module

**Input**: Design documents from `specs/003-certification-module/`
**Branch**: `003-certification-module`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no shared dependency)
- **[Story]**: User story this task belongs to (US1–US6)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, create folder scaffolding, register new schema in Drizzle config. Must complete before all other phases.

- [ ] T001 Install new runtime dependencies: `pnpm add @react-pdf/renderer qrcode @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` in repo root
- [ ] T002 [P] Install new dev/type dependencies: `pnpm add -D @types/qrcode` in repo root
- [ ] T003 [P] Add certification env vars to `.env.example`: `CERT_SIGNING_SECRET`, `CERT_STORAGE_BUCKET`, `CERT_STORAGE_ENDPOINT`, `CERT_STORAGE_ACCESS_KEY_ID`, `CERT_STORAGE_SECRET_ACCESS_KEY`, `CERT_BASE_URL`
- [ ] T004 Create domain folder scaffold: `src/domain/certificates/contracts/`, `src/domain/certificates/application/`, `src/domain/certificates/infrastructure/db/`, `src/domain/certificates/infrastructure/http/`
- [ ] T005 [P] Create app route scaffold: `src/app/api/certificates/`, `src/app/verify/[id]/`, `src/app/certificates/claim/[token]/`, `src/app/u/[username]/certificates/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema, migrations, domain contracts, and core signing service. ALL user stories depend on this phase completing first.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Create Drizzle schema file `src/domain/certificates/infrastructure/db/certificates-db.schema.ts` with all four tables: `certificates`, `certificate_events`, `certificate_jobs`, `completion_criteria` (from `specs/003-certification-module/data-model.md`)
- [ ] T007 Add `portfolioUsername` and `portfolioEnabled` columns to `src/db/schema/auth-schema.ts` via new Drizzle column definitions
- [ ] T008 Register new schema in `drizzle.config.ts`: add `./src/domain/certificates/infrastructure/db/certificates-db.schema.ts` to schema array and `"certificates"` to `schemaFilter`
- [ ] T009 Run `pnpm db:generate` to generate migration files, then `pnpm db:migrate` to apply — verify all four tables and `auth.user` columns are created in the DB
- [ ] T010 [P] Copy domain contracts from `specs/003-certification-module/contracts/certificate.contract.ts` → `src/domain/certificates/contracts/certificate.contract.ts`
- [ ] T011 [P] Create `src/domain/certificates/contracts/index.ts` barrel export for all contract types
- [ ] T012 Create `src/domain/certificates/application/certificate.errors.ts` with `CertificateError` class (mirrors `NextCourseError` pattern from `src/domain/courses/application/next-course.errors.ts`)
- [ ] T013 Implement `src/domain/certificates/application/certificate-signing.service.ts`: `sign(payload)` → hex string using `crypto.createHmac("sha256", CERT_SIGNING_SECRET)`, `verify(payload, hex)` → boolean using `crypto.timingSafeEqual`, `generateClaimToken()` → `crypto.randomBytes(32).toString("hex")`, `generateShortId(seq: number)` → `SX-{YEAR}-{5-digit}`
- [ ] T014 Implement `src/domain/certificates/infrastructure/db/certificates.repository.ts`: methods `create`, `findById`, `findByClaimToken`, `findByShortId`, `updateStatus`, `updateClaimToken`, `updateVisibility`, `list` (with filters), `listByUserId`, `findByUserCourseSeasonl` (idempotency check)
- [ ] T015 [P] Implement `src/domain/certificates/infrastructure/db/completion-criteria.repository.ts`: methods `findByCourseId`, `upsert` (admin sets criteria per course)
- [ ] T016 Create `src/domain/certificates/index.ts` public barrel export
- [ ] T017 Create `src/domain/certificates/application/index.ts` barrel export

**Checkpoint**: Foundational phase complete — migrations applied, contracts typed, signing service unit-testable. User story work can now begin.

---

## Phase 3: User Story 1 — Automated Certificate Issuance (Priority: P1) 🎯 MVP

**Goal**: When a participant meets completion criteria (watch % + quiz gate), a signed certificate is generated (PDF + PNG), stored in S3/R2, and a claim email is dispatched automatically — with zero manual admin intervention.

**Independent Test**: Seed a course with `CompletionCriteria`, call `CertificateIssuanceService.issue()` directly with a qualifying participant payload, then assert: a `certificates` row exists with status `PENDING`, a signed `signatureHex` matches re-computation, `pdfStorageKey` and `pngStorageKey` are non-null, a `certificate_events` row with type `issued` exists, and the nodemailer transport captured a claim email. Trigger again with the same inputs and assert `code: "already_exists"` (idempotency).

### Implementation

- [ ] T018 [US1] Implement `src/domain/certificates/application/certificate-pdf.service.ts`: React PDF document components for Mentee and Mentor templates using `@react-pdf/renderer`; `generatePdf(data): Promise<Buffer>`; `generatePng(data): Promise<Buffer>` (fixed 1200×630 canvas); embed QR code data URL from `CertificateSigningService`
- [ ] T019 [P] [US1] Implement `src/domain/certificates/application/certificate-storage.service.ts`: `upload(key, buffer, contentType): Promise<void>` using `@aws-sdk/client-s3`; `getPresignedUrl(key, ttlSeconds): Promise<string>` using `@aws-sdk/s3-request-presigner` (default TTL 900s = 15 min); storage key convention: `certificates/{id}/cert.pdf` and `certificates/{id}/cert.png`
- [ ] T020 [P] [US1] Implement `src/domain/certificates/application/certificate-email.service.ts`: `sendClaimEmail(to, recipientName, claimUrl): Promise<void>` and `sendReminderEmail(to, recipientName, claimUrl): Promise<void>` using `nodemailer`; HTML templates as TypeScript template literals; abstract behind `IEmailService` interface for testability
- [ ] T021 [US1] Implement `src/domain/certificates/application/certificate-issuance.service.ts`: orchestrates idempotency check → criteria guard → `sign()` → `generatePdf/Png()` → `upload()` → DB insert → `sendClaimEmail()`; returns `IssueCertificateResult`; single-cert path is fully synchronous; catches storage/email errors, retries up to 3× with exponential backoff before marking status `FAILED`
- [ ] T022 [US1] Integrate Courses → Certificates: in `src/domain/courses/application/next-course-enrollment.service.ts`, inject `CertificateIssuanceService` via constructor and call `issue()` after evaluating completion criteria against `CompletionCriteria`; call is fire-and-forget with error logging (does not block enrollment response)
- [ ] T023 [US1] Create POST `/api/certificates` route handler `src/app/api/certificates/route.ts`: admin-only endpoint for manual single certificate issuance; validates auth (admin role via `better-auth`); calls `CertificateIssuanceService.issue()`; returns `IssueCertificateResult`; declare `export const runtime = "nodejs"`
- [ ] T024 [US1] Create admin `CompletionCriteria` management endpoint `src/app/api/certificates/criteria/route.ts` (PUT): allows admin to set/update `minWatchPercentage`, `quizzesRequired`, `minQuizScore` per course; calls `completion-criteria.repository.upsert()`
- [ ] T025 [US1] Write unit tests for `CertificateSigningService` in `src/domain/certificates/application/certificate-signing.service.test.ts`: sign→verify roundtrip; tamper detection (mutate payload, verify returns false); `timingSafeEqual` path; `generateClaimToken` produces 64-char hex; `generateShortId` format

**Checkpoint**: US1 complete. A course completion event issues a signed certificate, generates PDF/PNG, stores assets, and sends claim email — fully automated, idempotent.

---

## Phase 4: User Story 2 — Recipient Claims and Shares Certificate (Priority: P1)

**Goal**: Recipient clicks the claim link, lands on a branded claim page showing their certificate, downloads PDF/PNG, copies shareable URL, and shares to LinkedIn — no login required.

**Independent Test**: Seed a `PENDING` certificate with a valid claim token. `GET /certificates/claim/{token}` returns 200 with certificate data. `POST /api/certificates/claim` with that token returns `code: "claimed"`, and the DB row shows `status: CLAIMED`, `claimedAt` set. Claim again → `code: "already_claimed"`. Expired token → `code: "token_expired"`. Download link resolves to a pre-signed S3 URL. LinkedIn share URL includes the verification URL.

### Implementation

- [ ] T026 [US2] Implement `src/domain/certificates/application/certificate-claim.service.ts`: `claim(input: ClaimCertificateInput): Promise<ClaimCertificateResult>` — validates token exists, not expired, not already used; atomically updates status to `CLAIMED`, sets `claimedAt`, nullifies `claimToken`; optionally links `userId` to wallet; logs `claimed` event; returns `ClaimCertificateResult`
- [ ] T027 [P] [US2] Create POST `/api/certificates/claim` route handler `src/app/api/certificates/claim/route.ts`: public endpoint (no auth required); accepts `{ claimToken, userId? }`; calls `CertificateClaimService.claim()`; declare `export const runtime = "nodejs"`
- [ ] T028 [P] [US2] Create GET `/api/certificates/[id]/download` route handler `src/app/api/certificates/[id]/download/route.ts`: returns a 15-min pre-signed URL for `cert.pdf` or `cert.png` based on `?format=pdf|png` query param; accessible without auth (URL is time-limited and non-guessable)
- [ ] T029 [US2] Build claim page `src/app/certificates/claim/[token]/page.tsx`: server component; resolves token → certificate data; displays certificate preview (name, program, role, QR code, completion date); shows Download PDF, Download PNG, Copy Link, Share to LinkedIn buttons; handles invalid/expired token states with clear UI messaging; `export const runtime = "nodejs"`
- [ ] T030 [US2] Implement LinkedIn share action in claim page: generates `https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(verifyUrl)}` URL; opens in new tab; logs `shared` event via `/api/certificates/[id]/events` POST
- [ ] T031 [US2] Add Open Graph meta tags to claim page in `src/app/certificates/claim/[token]/page.tsx`: `og:title`, `og:description`, `og:image` (points to certificate PNG pre-signed URL), `og:url` (verification URL), Twitter card tags
- [ ] T032 [US2] Write API test for claim flow in `src/app/api/certificates/claim/route.test.ts`: valid token → claimed; double-claim → already_claimed; expired token → token_expired; invalid token → token_invalid

**Checkpoint**: US2 complete. Recipients can claim certificates, download PDF/PNG, share to LinkedIn, and the page renders an OG preview card.

---

## Phase 5: User Story 3 — Public Certificate Verification (Priority: P1)

**Goal**: Any third party visits `/verify/:id`, sees VALID / REVOKED / INVALID status with full certificate context (name, program, role, skills, instructor, course CTA), within 1.5s LCP, without login.

**Independent Test**: Seed VALID, REVOKED, and non-existent certificate IDs. Visit `/verify/{validId}` — page renders "CERTIFICATE VALID" with recipient name, program, role, issue date, skills list, instructor name, "Learn more" CTA, and signature fingerprint. Visit `/verify/{revokedId}` — "CERTIFICATE REVOKED", no download. Visit `/verify/nonexistent` — "UNABLE TO VERIFY". Lighthouse score ≥ 90 for performance. Share the URL on LinkedIn → rich OG card appears.

### Implementation

- [ ] T033 [US3] Implement `src/domain/certificates/application/certificate-verification.service.ts`: `verify(input: VerifyCertificateInput): Promise<VerifyCertificateResult>` — fetches certificate, recomputes HMAC signature over canonical payload, uses `timingSafeEqual`; returns VALID/REVOKED/INVALID with full context (program duration, skill tags, instructor name, course slug from Courses repository); logs `verified` event asynchronously (non-blocking)
- [ ] T034 [P] [US3] Create GET `/api/certificates/verify/[id]` route handler `src/app/api/certificates/verify/[id]/route.ts`: public endpoint; calls `CertificateVerificationService.verify()`; returns `VerifyCertificateResult`; declare `export const runtime = "nodejs"`
- [ ] T035 [P] [US3] Build verification page `src/app/verify/[id]/page.tsx`: use `generateStaticParams` for known IDs with `revalidate = 60` for ISR; server component fetches from verification service; renders status badge (VALID green / REVOKED amber / INVALID red); displays full certificate context card; renders "Learn more on ScholarX →" CTA linking to `/courses/{slug}` (VALID only); renders signature fingerprint; WCAG 2.1 AA compliant
- [ ] T036 [US3] Add Open Graph meta tags to verification page in `src/app/verify/[id]/page.tsx`: dynamic `og:title` = "{recipientName}'s ScholarX Certificate", `og:image` (certificate PNG pre-signed URL), `og:description`, `og:url`; Twitter card `summary_large_image`
- [ ] T037 [US3] Write unit test for `CertificateVerificationService` in `src/domain/certificates/application/certificate-verification.service.test.ts`: VALID path (correct signature); REVOKED path; INVALID path (tampered data, signature mismatch); event logging is called

**Checkpoint**: US3 complete. Verification is live, public, fast, and renders a rich LinkedIn OG preview. CTA converts verifiers to learners.

---

## Phase 6: User Story 4 — Admin Certificate Management Dashboard (Priority: P2)

**Goal**: Admin can view all certificates with filters, trigger bulk season issuance, resend claim emails, revoke certificates with reason, and export CSV — from a protected dashboard.

**Independent Test**: Seed 10 certificate records (mix of PENDING/CLAIMED/REVOKED). Authenticate as admin. Filter by status=PENDING → returns correct subset. Click "Bulk Issue" for a season → job created, progress visible in dashboard. Click "Resend" on a PENDING cert → email dispatched, event logged. Click "Revoke" with reason → status=REVOKED, verify page reflects immediately. "Export CSV" → downloads correct CSV with all fields.

### Implementation

- [ ] T038 [US4] Implement `src/domain/certificates/application/certificate-admin.service.ts`: `list(query)`, `revoke(input)`, `resendClaimEmail(input)`, `bulkIssue(input)` (creates `certificate_jobs` row, returns job ID), `getBulkJobStatus(jobId)`, `exportCsv(query): Promise<string>` (CSV string)
- [ ] T039 [US4] Create GET `/api/certificates` route handler `src/app/api/certificates/route.ts` (extend existing): admin-only list with `status`, `courseId`, `seasonNumber`, `role`, `page`, `limit` query params; returns paginated `CertificateDTO[]`
- [ ] T040 [P] [US4] Create POST `/api/certificates/[id]/revoke` route handler `src/app/api/certificates/[id]/revoke/route.ts`: admin-only; accepts `{ reason }`; calls `CertificateAdminService.revoke()`; logs `revoked` event
- [ ] T041 [P] [US4] Create POST `/api/certificates/[id]/resend` route handler `src/app/api/certificates/[id]/resend/route.ts`: admin-only; calls `CertificateAdminService.resendClaimEmail()`; returns 200 on success
- [ ] T042 [P] [US4] Create GET `/api/certificates/export` route handler `src/app/api/certificates/export/route.ts`: admin-only; returns `Content-Type: text/csv` response with all certificate fields; filename header `certificates-export-{date}.csv`
- [ ] T043 [US4] Create POST `/api/certificates/bulk` route handler `src/app/api/certificates/bulk/route.ts`: admin-only; accepts `{ courseId, seasonNumber }`; creates `certificate_jobs` row; fetches qualifying participants from Courses domain; launches async processing loop (DB polling pattern); returns `{ jobId }` immediately; declare `export const runtime = "nodejs"`
- [ ] T044 [US4] Create GET `/api/certificates/jobs/[jobId]` route handler `src/app/api/certificates/jobs/[jobId]/route.ts`: admin-only; returns `BulkIssueJobDTO` with `totalCount`, `processedCount`, `failedCount`, `status`; used for dashboard polling
- [ ] T045 [P] [US4] Build admin certificate list page `src/app/(admin)/admin/certificates/page.tsx`: filterable table (season, status, role dropdowns); paginated; "Bulk Issue" button; "Export CSV" button; each row has "Resend" and "Revoke" action buttons; real-time bulk job progress bar (polling `/api/certificates/jobs/[jobId]` every 2s via `useEffect`); protected by admin auth guard
- [ ] T046 [P] [US4] Build admin certificate detail page `src/app/(admin)/admin/certificates/[id]/page.tsx`: full certificate details; claim rate summary for the season; audit event timeline from `certificate_events`; "Revoke" modal with reason field; "Resend" button

**Checkpoint**: US4 complete. Admin can fully manage the certificate lifecycle with zero manual per-cert effort after bulk trigger.

---

## Phase 7: User Story 5 — Recipient Credential Wallet (Priority: P2)

**Goal**: Authenticated recipient can view all their claimed certificates, download any as PDF/PNG, and share to LinkedIn from a single private wallet page.

**Independent Test**: Authenticate as a recipient with 2 claimed certificates. Navigate to `/my/certificates`. Both appear as cards. Click "Download PDF" → pre-signed URL resolves to PDF. Click "Share to LinkedIn" → LinkedIn share dialog opens with correct verification URL. Wallet shows 0 certs for a user with none.

### Implementation

- [ ] T047 [US5] Implement `src/domain/certificates/application/certificate-portfolio.service.ts`: `getWallet(userId): Promise<CertificateDTO[]>` (returns all certs for user); `toggleVisibility(certId, userId, isPublic)`; `setPortfolioUsername(input)`; `getPublicPortfolio(username): Promise<PublicPortfolioDTO | null>` (returns only `isPublic = true` certs)
- [ ] T048 [P] [US5] Create GET `/api/certificates/wallet` route handler `src/app/api/certificates/wallet/route.ts`: authenticated (any logged-in user); returns `CertificateDTO[]` for the session user; calls `CertificatePortfolioService.getWallet(userId)`
- [ ] T049 [P] [US5] Build wallet page `src/app/my/certificates/page.tsx`: authenticated server component (redirect to login if unauthenticated); fetches wallet data; renders certificate cards with program name, season, role, status badge, issue date; "Download PDF", "Download PNG", "Share to LinkedIn", "Copy Link" action buttons per card; Framer Motion card entrance animations; empty state with CTA to explore courses

**Checkpoint**: US5 complete. Recipients have a private hub for all their credentials with full download and share capabilities.

---

## Phase 8: User Story 6 — Public Credential Portfolio Page (Priority: P3)

**Goal**: Recipients can enable a public SEO-indexed portfolio at `/u/:username/certificates` showing opted-in certificates, shareable as a professional portfolio link.

**Independent Test**: Set username "testuser" for a recipient. Toggle cert-A to `isPublic=true`, cert-B stays `isPublic=false`. Navigate (unauthenticated) to `/u/testuser/certificates` → only cert-A appears. Search engine crawler receives `og:title`, no `noindex`. Disable portfolio → page returns "Profile not available" and `X-Robots-Tag: noindex`. Duplicate username attempt → 409 with validation error.

### Implementation

- [ ] T050 [US6] Create GET/PUT `/api/certificates/portfolio` route handler `src/app/api/certificates/portfolio/route.ts`: authenticated; PUT accepts `{ username, enabled }` — validates username format (`/^[a-z0-9-]{3,30}$/`), checks uniqueness against `auth.user`, updates `portfolioUsername` and `portfolioEnabled`; GET returns current portfolio settings for session user
- [ ] T051 [P] [US6] Create PATCH `/api/certificates/[id]/visibility` route handler `src/app/api/certificates/[id]/visibility/route.ts`: authenticated (recipient must own the certificate); accepts `{ isPublic: boolean }`; calls `CertificatePortfolioService.toggleVisibility()`
- [ ] T052 [P] [US6] Create GET `/api/certificates/portfolio/[username]` route handler `src/app/api/certificates/portfolio/[username]/route.ts`: public endpoint; calls `CertificatePortfolioService.getPublicPortfolio(username)`; returns 404 if username not found or portfolio disabled
- [ ] T053 [P] [US6] Build portfolio settings page `src/app/my/certificates/settings/page.tsx`: authenticated; username input with real-time availability check (debounced GET to `/api/certificates/portfolio/[username]`); portfolio enable/disable toggle; per-certificate `isPublic` toggle grid showing all claimed certs; save button
- [ ] T054 [US6] Build public portfolio page `src/app/u/[username]/certificates/page.tsx`: public server component; `generateStaticParams` disabled (dynamic per user); fetches `PublicPortfolioDTO` from portfolio service; renders certificate cards (only public ones) with links to `/verify/:id`; "Profile not available" state when portfolio disabled; dynamic Open Graph meta: `og:title = "{name}'s Certificates — ScholarX"`, `og:description`, `og:image` (first cert PNG)
- [ ] T055 [US6] Implement `noindex` logic in public portfolio page: when `portfolioEnabled = false`, set `export const metadata = { robots: "noindex" }` in Next.js page metadata and respond with `X-Robots-Tag: noindex` response header; when enabled, ensure no noindex directive present

**Checkpoint**: US6 complete. Recipients have a viral-growth-ready public portfolio page. Each page is an SEO entry point for ScholarX.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, performance, observability, GDPR, and security hardening across all stories.

- [ ] T056 [P] Add WCAG 2.1 AA audit to verify, claim, and portfolio pages: run Lighthouse accessibility audit; fix any contrast ratio failures; ensure all interactive elements have accessible labels; keyboard navigation works
- [ ] T057 [P] Implement GDPR erasure endpoint `src/app/api/certificates/gdpr/route.ts`: DELETE endpoint (admin-only); anonymizes `recipientEmail` → `deleted@scholarx.lk` and `recipientName` → `[Redacted]`, sets `userId = null`; leaves certificate and event records intact for audit compliance
- [ ] T058 [P] Add rate limiting to public verification endpoint `src/app/api/certificates/verify/[id]/route.ts`: IP-based rate limit (60 req/min via in-memory or Redis-free token bucket); return 429 with `Retry-After` header on breach
- [ ] T059 [P] Add automated 7-day reminder email: add `reminderSentAt` column to `certificates` table (new Drizzle migration); create cron API route `src/app/api/cron/certificates-reminder/route.ts` that queries unclaimed certs where `issuedAt < NOW() - 7 days AND reminderSentAt IS NULL` and dispatches reminder emails
- [ ] T060 [P] Add Sentry error tracking to all certificate service methods: wrap `CertificateIssuanceService`, `CertificateVerificationService`, and `CertificateClaimService` in try/catch with `Sentry.captureException()` per the constitution's Observability requirement
- [ ] T061 [P] TypeScript strict-mode audit: run `tsc --noEmit` and resolve any implicit `any`, missing return types, or unresolved types introduced by the new domain
- [ ] T062 Validate quickstart.md steps end-to-end: follow `specs/003-certification-module/quickstart.md` from a clean `.env.local`, confirm all steps produce a working single-cert issuance

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)          → no dependencies, start immediately
Phase 2 (Foundational)   → depends on Phase 1 ✅ BLOCKS all user stories
Phase 3 (US1)            → depends on Phase 2
Phase 4 (US2)            → depends on Phase 2, uses certificates row from US1
Phase 5 (US3)            → depends on Phase 2, uses certificates row from US1
Phase 6 (US4)            → depends on Phase 3 (needs IssuanceService for bulk)
Phase 7 (US5)            → depends on Phase 4 (needs claimed certs for wallet)
Phase 8 (US6)            → depends on Phase 7 (wallet settings extend into portfolio)
Phase 9 (Polish)         → depends on Phases 3–8
```

### User Story Dependencies

| Story | Depends On | Can run in parallel with |
|---|---|---|
| US1 (Issuance) | Phase 2 | — |
| US2 (Claim) | Phase 2 | US3 |
| US3 (Verification) | Phase 2 | US2 |
| US4 (Admin) | US1 (IssuanceService) | US2, US3 (after US1 complete) |
| US5 (Wallet) | US2 (claimed certs needed) | US4 |
| US6 (Portfolio) | US5 (wallet settings base) | — |

### Parallel Opportunities Per Phase

```bash
# Phase 1 — run T001–T005 in parallel (different concerns)
T001 (deps install) || T002 (dev deps) || T003 (env vars) || T004 (folders) || T005 (route scaffold)

# Phase 2 — T010–T012 parallelizable after T006–T009 complete
T006 → T007 → T008 → T009 (sequential: schema → migration)
T010 || T011 || T012 (after T009: contracts + errors can be parallel)
T013 → T014 || T015 (signing before repo; repos parallel)

# Phase 3 — T018 must start, T019 || T020 parallel after
T018 (PDF service) → T021 (IssuanceService orchestrator)
T019 (Storage) || T020 (Email) — parallel with T018

# Phase 5 — T034 || T035 || T036 parallel after T033
T033 (VerificationService) → T034 || T035 || T036

# Phase 6 — T040 || T041 || T042 || T045 || T046 parallel after T038–T039
T038 → T039 (AdminService → list endpoint)
T040 || T041 || T042 || T043 || T044 (parallel admin endpoints)
T045 || T046 (parallel admin UI pages)
```

---

## Implementation Strategy

### MVP Scope (Phases 1–3 + Phase 5 US3)

Minimum viable increment that delivers real user value:

1. Complete **Phase 1** (Setup)
2. Complete **Phase 2** (Foundational — DB + contracts + signing)
3. Complete **Phase 3** (US1 — automated issuance)
4. Complete **Phase 5** (US3 — public verification page)
5. **STOP and VALIDATE**: A complete certificate can be issued and publicly verified ✅
6. Demo/deploy — system is live and credible

### Incremental Delivery After MVP

```
MVP (Phase 1+2+3+5)  → Issuance + Verification live ✅
+ Phase 4 (US2)      → Recipients can claim and share → LinkedIn virality unlocked 🚀
+ Phase 6 (US4)      → Admin dashboard operational → bulk issuance capability
+ Phase 7 (US5)      → Wallet → recipients have permanent credential home
+ Phase 8 (US6)      → Public portfolio → SEO growth loop activated
+ Phase 9 (Polish)   → GDPR, accessibility, observability production-ready
```

### Parallel Team Strategy (2 developers)

After Phase 2 complete:
- **Dev A**: Phase 3 (US1 Issuance) → Phase 6 (US4 Admin)
- **Dev B**: Phase 4 (US2 Claim) + Phase 5 (US3 Verification) in parallel

---

## Notes

- All API routes using `crypto`, `@react-pdf/renderer`, or `nodemailer` MUST declare `export const runtime = "nodejs"` at the top of the file
- Task IDs T001–T062 are in strict dependency order — do not skip forward
- [P] tasks within a phase share no file or state dependency and can be launched simultaneously
- Each phase ends with a testable checkpoint — validate before advancing
- Constitution compliance: all new TypeScript files must have explicit types; no `any`; Framer Motion on all new UI pages per Principle IV
