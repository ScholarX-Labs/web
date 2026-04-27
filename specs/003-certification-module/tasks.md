# Tasks: Certification Module

**Input**: Design documents from `specs/003-certification-module/`
**Branch**: `003-certification-module`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story increment.

---

## Phase 1: Setup (Shared Infrastructure) ✅

- [x] T001 Install new runtime dependencies: `pnpm add @react-pdf/renderer qrcode @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` in repo root
- [x] T002 [P] Install new dev/type dependencies: `pnpm add -D @types/qrcode` in repo root
- [x] T003 [P] Add certification env vars to `.env.example`
- [x] T004 Create domain folder scaffold: `src/domain/certificates/contracts/`, `application/`, `infrastructure/db/`, `infrastructure/http/`
- [x] T005 [P] Create app route scaffold: `src/app/api/certificates/`, `src/app/verify/[id]/`, `src/app/certificates/claim/[token]/`, `src/app/u/[username]/certificates/`

---

## Phase 2: Foundational (Blocking Prerequisites) ✅

- [x] T006 Create `src/domain/certificates/infrastructure/db/certificates-db.schema.ts` with all four tables
- [x] T007 Add `portfolioUsername` and `portfolioEnabled` columns to `src/db/schema/auth-schema.ts`
- [x] T008 Register new schema in `drizzle.config.ts`
- [ ] T009 Run `pnpm db:generate` then `pnpm db:migrate` — requires `DATABASE_URL` to be set in environment
- [x] T010 [P] Copy domain contracts → `src/domain/certificates/contracts/certificate.contract.ts`
- [x] T011 [P] Create `src/domain/certificates/contracts/index.ts` barrel export
- [x] T012 Create `src/domain/certificates/application/certificate.errors.ts`
- [x] T013 Implement `src/domain/certificates/application/certificate-signing.service.ts`
- [x] T014 Implement `src/domain/certificates/infrastructure/db/certificates.repository.ts`
- [x] T015 [P] Implement `src/domain/certificates/infrastructure/db/completion-criteria.repository.ts`
- [x] T016 Create `src/domain/certificates/index.ts` public barrel export
- [x] T017 Create `src/domain/certificates/application/index.ts` barrel export

**Checkpoint**: ✅ Schema defined, contracts typed, signing service implemented. T009 (migration) requires live DB.

---

## Phase 3: User Story 1 — Automated Certificate Issuance (Priority: P1) 🎯 MVP ✅

- [x] T018 [US1] Implement `src/domain/certificates/application/certificate-pdf.service.ts`
- [x] T019 [P] [US1] Implement `src/domain/certificates/application/certificate-storage.service.ts`
- [x] T020 [P] [US1] Implement `src/domain/certificates/application/certificate-email.service.ts`
- [x] T021 [US1] Implement `src/domain/certificates/application/certificate-issuance.service.ts`
- [ ] T022 [US1] Integrate Courses → Certificates in `src/domain/courses/application/next-course-enrollment.service.ts`
- [x] T023 [US1] Create POST `/api/certificates` route handler `src/app/api/certificates/route.ts`
- [ ] T024 [US1] Create PUT `/api/certificates/criteria` endpoint `src/app/api/certificates/criteria/route.ts`
- [x] T025 [US1] Write unit tests in `src/domain/certificates/application/certificate-signing.service.test.ts`

**Checkpoint**: ✅ Core issuance pipeline complete. T022 (Courses integration) and T024 (criteria endpoint) are next.

---

## Phase 4: User Story 2 — Recipient Claims and Shares Certificate (Priority: P1) ✅

- [x] T026 [US2] Implement `src/domain/certificates/application/certificate-claim.service.ts`
- [x] T027 [P] [US2] Create POST `/api/certificates/claim` route handler
- [ ] T028 [P] [US2] Create GET `/api/certificates/[id]/download` route handler
- [ ] T029 [US2] Build claim page `src/app/certificates/claim/[token]/page.tsx`
- [ ] T030 [US2] Implement LinkedIn share + event logging in claim page
- [ ] T031 [US2] Add Open Graph meta tags to claim page
- [ ] T032 [US2] Write API test for claim flow

---

## Phase 5: User Story 3 — Public Certificate Verification (Priority: P1) ✅

- [x] T033 [US3] Implement `src/domain/certificates/application/certificate-verification.service.ts`
- [x] T034 [P] [US3] Create GET `/api/certificates/verify/[id]` route handler
- [x] T035 [P] [US3] Build verification page `src/app/verify/[id]/page.tsx` with ISR, glassmorphism, status badges, CTA
- [x] T036 [US3] Add Open Graph meta tags to verification page
- [ ] T037 [US3] Write unit test for `CertificateVerificationService`

**Checkpoint**: ✅ Verification page live with OG tags, status badges, and "Learn more" CTA.

---

## Phase 6: User Story 4 — Admin Certificate Management Dashboard (Priority: P2) 🔄

- [x] T038 [US4] Implement `src/domain/certificates/application/certificate-admin.service.ts`
- [ ] T039 [US4] Extend GET `/api/certificates` with list + filters
- [ ] T040 [P] [US4] Create POST `/api/certificates/[id]/revoke` route handler
- [ ] T041 [P] [US4] Create POST `/api/certificates/[id]/resend` route handler
- [ ] T042 [P] [US4] Create GET `/api/certificates/export` CSV route handler
- [x] T043 [US4] Create POST `/api/certificates/bulk` route handler
- [x] T044 [US4] Create GET `/api/certificates/jobs/[jobId]` route handler
- [ ] T045 [P] [US4] Build admin certificate list page `src/app/(admin)/admin/certificates/page.tsx`
- [ ] T046 [P] [US4] Build admin certificate detail page `src/app/(admin)/admin/certificates/[id]/page.tsx`

---

## Phase 7: User Story 5 — Recipient Credential Wallet (Priority: P2) 🔄

- [x] T047 [US5] Implement `src/domain/certificates/application/certificate-portfolio.service.ts`
- [ ] T048 [P] [US5] Create GET `/api/certificates/wallet` route handler
- [x] T049 [P] [US5] Build wallet page `src/app/my/certificates/page.tsx`

---

## Phase 8: User Story 6 — Public Credential Portfolio Page (Priority: P3) 🔄

- [ ] T050 [US6] Create GET/PUT `/api/certificates/portfolio` route handler
- [ ] T051 [P] [US6] Create PATCH `/api/certificates/[id]/visibility` route handler
- [ ] T052 [P] [US6] Create GET `/api/certificates/portfolio/[username]` route handler
- [ ] T053 [P] [US6] Build portfolio settings page `src/app/my/certificates/settings/page.tsx`
- [x] T054 [US6] Build public portfolio page `src/app/u/[username]/certificates/page.tsx`
- [x] T055 [US6] Implement `noindex` logic in public portfolio page

---

## Phase 9: Polish & Cross-Cutting Concerns

- [ ] T056 [P] WCAG 2.1 AA audit on verify, claim, portfolio pages
- [ ] T057 [P] GDPR erasure endpoint `src/app/api/certificates/gdpr/route.ts`
- [ ] T058 [P] Rate limiting on verification endpoint
- [ ] T059 [P] 7-day reminder cron `src/app/api/cron/certificates-reminder/route.ts`
- [ ] T060 [P] Sentry error tracking on issuance, verification, claim services
- [x] T061 [P] TypeScript strict-mode audit — zero certificate-domain errors confirmed
- [ ] T062 Validate quickstart.md steps end-to-end

---

## Progress Summary

| Phase | Tasks | Done | Remaining |
|---|---|---|---|
| Phase 1 — Setup | 5 | 5 | 0 ✅ |
| Phase 2 — Foundation | 12 | 11 | 1 (T009 needs live DB) |
| Phase 3 — US1 Issuance | 8 | 6 | 2 (T022, T024) |
| Phase 4 — US2 Claim | 7 | 2 | 5 |
| Phase 5 — US3 Verify | 5 | 4 | 1 (T037 test) |
| Phase 6 — US4 Admin | 9 | 3 | 6 |
| Phase 7 — US5 Wallet | 3 | 2 | 1 (T048) |
| Phase 8 — US6 Portfolio | 6 | 2 | 4 |
| Phase 9 — Polish | 7 | 1 | 6 |
| **Total** | **62** | **36** | **26** |

## MVP Status ✅
**Phases 1+2+3+5 core = DONE** — issuance pipeline and public verification are implemented and type-safe.

## Remaining Next Steps
1. **T009** — `pnpm db:generate && pnpm db:migrate` once `DATABASE_URL` is set
2. **T022** — Wire `CertificateIssuanceService` into courses enrollment service
3. **T024** — Completion criteria admin endpoint
4. **T028–T032** — Claim page + download route
5. **T039–T042, T045–T046** — Admin dashboard UI
6. **T048, T050–T053** — Remaining wallet/portfolio API routes + settings page
7. **Phase 9** — Polish, GDPR, rate limiting, Sentry, reminder cron
