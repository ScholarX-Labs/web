# Implementation Plan: Certification Module

**Branch**: `003-certification-module` | **Date**: 2026-04-28 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/003-certification-module/spec.md`

---

## Summary

The Certification Module adds automated, cryptographically signed digital certificate issuance to ScholarX V2. When a learner reaches the configured video watch threshold (tracked automatically by the existing `useLessonProgress` telemetry hook), the system triggers synchronous certificate generation (PDF + PNG), stores the assets on S3, sends a branded claim email via Nodemailer, and surfaces a celebratory modal over the video player. Admins can additionally trigger bulk issuance for an entire course season from the dashboard. Recipients can claim, download, share, and optionally build a public portfolio page.

This is an **embedded Next.js module** — no separate service, no Redis/BullMQ, no external queue. It shares the existing database, auth, and deployment pipeline.

---

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16 (App Router)  
**Primary Dependencies**: Drizzle ORM, Better-Auth, Vidstack React, Framer Motion, @react-pdf/renderer, nodemailer, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, canvas-confetti, html-to-image (new), @react-email/render (new)  
**Storage**: PostgreSQL (Neon/Supabase compatible via Drizzle); AWS S3 for PDF/PNG assets  
**Testing**: Node.js built-in test runner (`node --import tsx --test`)  
**Target Platform**: Vercel (primary) / Cloudflare Workers (optional — open-next config disabled)  
**Performance Goals**: Single cert generation < 5s P95; verification page LCP < 1.5s on 4G; claim email delivery < 60s  
**Constraints**: No Redis/BullMQ (DB-backed job table for bulk); no Puppeteer/headless Chrome; no separate microservice  
**Scale/Scope**: ~50–500 participants per course season; up to ~10k total certificates in Y1

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. SOLID Architecture** | ✅ PASS | Domain layer (`src/domain/certificates/`) owns all business logic. API route handlers are thin coordinators. `CertificateService` has single responsibility. Observer pattern used for course completion event subscription. |
| **II. Type Safety (no `any`)** | ✅ PASS | All domain types defined in `src/domain/certificates/types.ts`. Zod schemas validate all API inputs. No `any` in new code. |
| **III. Rigorous Testing** | ✅ PASS | Unit tests for signing/verification (pure functions), `useLessonProgress` completion threshold, and service layer integration tests planned in tasks. |
| **IV. Premium UX** | ✅ PASS | Celebration modal uses Framer Motion + canvas-confetti. Verification page and claim page follow the glassmorphism design language. WCAG 2.1 AA required (SC-010). |
| **V. Performance & Maintainability** | ✅ PASS | Verification page as a Server Component (no client JS overhead). Presigned S3 URLs (15-min TTL). Lazy-loaded celebration modal to avoid bundle bloat. |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-certification-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api-contracts.md # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── db/
│   └── schema/
│       ├── auth-schema.ts                  # EXISTING — portfolioUsername/portfolioEnabled already added
│       └── certification-schema.ts         # NEW — completion_criteria, certificates, certificate_events, bulk_issuance_jobs
│
├── domain/
│   └── certificates/
│       ├── types.ts                        # NEW — TypeScript domain types
│       ├── schemas.ts                      # NEW — Zod validation schemas
│       ├── certificate.service.ts          # NEW — Core issuance, signing, revocation logic
│       ├── certificate.service.test.ts     # NEW — Unit + integration tests
│       └── bulk-issuance.service.ts        # NEW — Bulk job processing logic
│
├── lib/
│   ├── certificate-signing.ts             # NEW — HMAC-SHA256 sign/verify utilities
│   ├── certificate-signing.test.ts        # NEW — Unit tests for signing
│   ├── certificate-pdf.tsx               # NEW — @react-pdf/renderer PDF template
│   ├── certificate-png.tsx               # NEW — html-to-image PNG template
│   └── emails/
│       ├── claim-email.tsx               # NEW — @react-email claim email template
│       └── reminder-email.tsx            # NEW — @react-email 7-day reminder template
│
├── actions/
│   └── certificates/
│       ├── issue-certificate.action.ts    # NEW — Server Action: single issuance
│       ├── claim-certificate.action.ts    # NEW — Server Action: claim flow
│       ├── revoke-certificate.action.ts   # NEW — Server Action: revoke
│       └── update-portfolio.action.ts     # NEW — Server Action: username/visibility
│
├── hooks/
│   ├── use-lesson-progress.ts             # EXISTING — add onCompleted callback support
│   └── use-certificate-completion.ts      # NEW — orchestrates modal + Server Action call
│
├── components/
│   └── certificates/
│       ├── CelebrationModal.tsx           # NEW — Framer Motion + confetti modal
│       ├── CertificateCard.tsx            # NEW — Wallet/portfolio card component
│       ├── VerificationBadge.tsx          # NEW — VALID/REVOKED/INVALID status badge
│       └── ShareActions.tsx               # NEW — LinkedIn / Copy URL / Download buttons
│
└── app/
    ├── verify/
    │   └── [id]/
    │       └── page.tsx                   # EXISTING stub → IMPLEMENT
    ├── certificates/
    │   └── claim/
    │       └── [token]/
    │           └── page.tsx               # EXISTING stub → IMPLEMENT
    ├── my/
    │   └── certificates/
    │       └── page.tsx                   # EXISTING stub → IMPLEMENT (Wallet)
    ├── u/
    │   └── [username]/
    │       └── certificates/
    │           └── page.tsx               # EXISTING stub → IMPLEMENT (Portfolio)
    └── api/
        └── certificates/
            ├── route.ts                   # EXISTING stub → IMPLEMENT (list + issue)
            ├── bulk/
            │   └── route.ts               # EXISTING stub → IMPLEMENT
            ├── claim/
            │   └── route.ts               # EXISTING stub → IMPLEMENT
            ├── jobs/
            │   └── [jobId]/
            │       └── route.ts           # NEW
            ├── portfolio/
            │   ├── route.ts               # EXISTING stub → IMPLEMENT
            │   └── username/
            │       ├── route.ts           # NEW
            │       └── check/
            │           └── route.ts       # NEW
            └── verify/
                └── [id]/
                    └── route.ts           # EXISTING stub → IMPLEMENT
```

**Structure Decision**: Single Next.js monorepo. The domain layer (`src/domain/certificates/`) owns all business logic. API routes are thin coordinators that call the service layer. UI components live in `src/components/certificates/`. Pages live in their respective `src/app/` route directories. This cleanly enforces the Dependency Inversion Principle (Constitution §I).

---

## Complexity Tracking

No constitution violations detected. All design choices follow established project patterns (Drizzle schema, Server Actions, Better-Auth session, existing S3 SDK).
