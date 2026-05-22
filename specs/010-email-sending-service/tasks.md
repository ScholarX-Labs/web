# Tasks: Production Email Sending Service

**Input**: Design documents from `specs/010-email-sending-service/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. The feature handles authentication email delivery, retries, provider fallback, concurrency, and operational visibility.

**Organization**: Tasks are grouped by user story to allow independently testable increments.

## Phase 1: Setup

**Purpose**: Establish shared file structure and project wiring without changing behavior.

- [X] T001 Create email domain directories in `src/domain/email/`
- [X] T002 Create email worker directory and entry file in `src/worker/email-delivery-worker.ts`
- [X] T003 Add email Drizzle schema export path to `drizzle.config.ts`
- [X] T004 Verify ignore files cover Node, logs, build outputs, and private environment files in `.gitignore` and Docker ignore config

---

## Phase 2: Foundational

**Purpose**: Blocking types, ports, schema, configuration, and tests required before user-story behavior.

- [X] T005 [P] Add domain types, status enums, failure categories, provider names, and DTOs in `src/domain/email/contracts/email-types.ts`
- [X] T006 [P] Add repository, provider, policy, rate limiter, circuit breaker, metrics, clock, and logger ports in `src/domain/email/contracts/`
- [X] T007 [P] Add Zod request/config schemas in `src/domain/email/application/email-delivery.schemas.ts`
- [X] T008 [P] Add Drizzle email schema tables and indexes in `src/db/schema/email-db.schema.ts`
- [X] T009 Add `src/db/schema/email-db.schema.ts` to `drizzle.config.ts`
- [ ] T010 [P] Add fake provider, in-memory metrics, clock, logger, and repository test helpers in `src/domain/email/application/email-test-helpers.ts`
- [ ] T011 [P] Add initial service tests for validation, primary success, fallback success, duplicate idempotency, and failure classification in `src/domain/email/application/email-delivery.service.test.ts`
- [ ] T012 [P] Add repository contract/concurrency tests in `src/domain/email/infrastructure/db/drizzle-email-delivery.repository.test.ts`
- [ ] T013 [P] Add worker concurrency tests in `src/worker/email-delivery-worker.test.ts`

**Checkpoint**: Foundational contracts and failing tests are ready before implementation.

---

## Phase 3: User Story 1 - Send Critical Platform Emails Reliably (Priority: P1) MVP

**Goal**: Send transactional emails through the primary provider and use Gmail fallback only after eligible primary failure.

**Independent Test**: Valid primary send is accepted once; primary temporary failure uses Gmail fallback once; full provider failure returns a safe failed result.

- [X] T014 [P] [US1] Implement email error classifier in `src/domain/email/application/email-error-classifier.ts`
- [X] T015 [P] [US1] Implement retry and fallback policies in `src/domain/email/application/email-policies.ts`
- [X] T016 [P] [US1] Implement Nodemailer provider adapter in `src/domain/email/infrastructure/providers/nodemailer-email-provider.ts`
- [X] T017 [P] [US1] Implement typed environment config loader in `src/domain/email/infrastructure/email-config.ts`
- [X] T018 [US1] Implement email delivery orchestration service in `src/domain/email/application/email-delivery.service.ts`
- [X] T019 [US1] Implement service factory in `src/domain/email/factory/email-service.factory.ts`
- [X] T020 [US1] Refactor `src/lib/email.ts` to preserve `sendEmail` facade and delegate to the new service
- [X] T021 [US1] Update Better Auth OTP and reset password calls in `src/lib/auth.ts` to pass category and idempotency context

**Checkpoint**: Primary and fallback sending paths are functional through the existing `sendEmail` facade.

---

## Phase 4: User Story 2 - Know Whether Email Sending Worked (Priority: P1)

**Goal**: Persist queryable delivery records, attempts, provider results, and later events with structured metrics.

**Independent Test**: Success, fallback, validation failure, provider failure, and webhook event cases each produce queryable status and attempt history.

- [X] T022 [US2] Implement Drizzle repository with delivery, attempt, event, circuit, and rate-limit persistence in `src/domain/email/infrastructure/db/drizzle-email-delivery.repository.ts`
- [X] T023 [US2] Add PostgreSQL row-claiming, lease recovery, accepted-attempt repair, and transactional `finishAttemptAndMarkAccepted` to `src/domain/email/infrastructure/db/drizzle-email-delivery.repository.ts`
- [X] T024 [P] [US2] Implement DB-backed circuit breaker in `src/domain/email/application/provider-circuit-breaker.ts`
- [X] T025 [P] [US2] Implement PostgreSQL-backed rate limiter in `src/domain/email/application/email-rate-limiter.ts`
- [X] T026 [P] [US2] Implement telemetry metrics sink in `src/domain/email/application/email-metrics.ts`
- [X] T027 [US2] Implement provider webhook route in `src/app/api/email/provider-events/[provider]/route.ts`
- [X] T028 [US2] Implement admin list/detail/retry routes in `src/app/api/admin/email-deliveries/`
- [X] T029 [US2] Implement email worker drain loop in `src/worker/email-delivery-worker.ts`

**Checkpoint**: Delivery status, attempts, retry worker, metrics, and webhook ingestion are independently testable.

---

## Phase 5: User Story 3 - Protect Recipients, Credentials, and Reputation (Priority: P2)

**Goal**: Ensure credentials, message bodies, raw provider payloads, and private diagnostics do not leak.

**Independent Test**: Logs and API responses contain masked recipients/hashes only, no secrets, and admin routes enforce authorization.

- [X] T030 [P] [US3] Add sanitization and hashing helpers in `src/domain/email/application/email-sanitization.ts`
- [X] T031 [US3] Wire sanitized logging and error responses through `src/domain/email/application/email-delivery.service.ts`
- [X] T032 [US3] Enforce admin authorization and safe response DTOs in `src/app/api/admin/email-deliveries/`
- [ ] T033 [US3] Add security-focused tests for secret redaction and unauthorized access in `src/domain/email/application/email-delivery.service.test.ts`

**Checkpoint**: Security and privacy boundaries are enforced for delivery operations.

---

## Phase 6: User Story 4 - Support Operational Retries and Recovery (Priority: P2)

**Goal**: Safely retry failed or delayed email requests without duplicate sends.

**Independent Test**: Multi-worker retry selection never claims the same delivery twice and stale leases recover safely.

- [X] T034 [US4] Complete worker retry scheduling and lease release behavior in `src/worker/email-delivery-worker.ts`
- [X] T035 [US4] Complete manual retry behavior in `src/app/api/admin/email-deliveries/[deliveryId]/retry/route.ts`
- [ ] T036 [US4] Add stale lease and orphan accepted-attempt repair tests in `src/domain/email/infrastructure/db/drizzle-email-delivery.repository.test.ts`
- [ ] T037 [US4] Add 50,000-user burst simulation test scaffold in `src/domain/email/application/email-delivery.service.test.ts`

**Checkpoint**: Retry and recovery behavior is safe under concurrency.

---

## Phase 7: Polish & Validation

**Purpose**: Finish verification, operational docs, and task closure.

- [ ] T038 [P] Update quickstart implementation notes in `specs/010-email-sending-service/quickstart.md`
- [ ] T039 Run `pnpm run typecheck`
- [ ] T040 Run `pnpm run test`
- [ ] T041 Validate implementation against `specs/010-email-sending-service/plan.md`
- [ ] T042 Confirm all tasks are checked complete in `specs/010-email-sending-service/tasks.md`

---

## Dependencies & Execution Order

- Phase 1 setup must complete before Phase 2.
- Phase 2 foundational tasks block all user stories.
- US1 and US2 are both P1; implement US1 first because existing auth flows depend on the facade.
- US2 can proceed after foundational tasks but depends on shared types and repository ports.
- US3 depends on US1 and US2 because it hardens the delivery and admin surfaces.
- US4 depends on US2 because retry recovery needs persistent records and worker claims.
- Polish depends on all selected user stories.

## Parallel Opportunities

- T005, T006, T007, T008, T010, T011, T012, and T013 touch different files and can be prepared independently after setup.
- T014, T015, T016, and T017 can run in parallel before T018.
- T024, T025, and T026 can run in parallel after repository contracts exist.
- T030 can run before T031 and T032.

## Implementation Strategy

1. Complete Setup and Foundational tasks.
2. Deliver US1 as MVP so existing Better Auth OTP/password reset email paths continue through the new facade.
3. Add US2 persistence, observability, worker, webhook, and admin status.
4. Add US3 hardening.
5. Add US4 retry/recovery scale behavior.
6. Run typecheck and tests before marking implementation complete.
