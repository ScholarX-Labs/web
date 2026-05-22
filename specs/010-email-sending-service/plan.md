# Implementation Plan: Production Email Sending Service

**Branch**: `010-email-sending-service` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/010-email-sending-service/spec.md`

## Summary

ScholarX needs a production email delivery loop that starts from the currently working mailbox send path, promotes it into a typed and observable application service, and falls back to Gmail only after an eligible primary-channel failure. The implementation will replace the current fire-and-forget `src/lib/email.ts` helper with a domain-backed delivery service that records every request, every provider attempt, final accepted/failed state, and later delivery events where available.

The immediate production risk is credential hygiene: `C:\Users\dell\Documents\ScholarX\V2\email-test\test_email.py` contains a hardcoded mailbox password. Before implementation or rollout, that credential must be rotated and the test moved to managed private configuration.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 App Router  
**Primary Dependencies**: Nodemailer, Better Auth, Drizzle ORM, Zod, PostgreSQL, existing Sentry/telemetry dependency, existing rate-limit utilities where applicable  
**Storage**: PostgreSQL through Drizzle schema and migrations  
**Testing**: Node test runner with `tsx`, TypeScript typecheck, focused service/repository/route tests, provider adapter fakes  
**Target Platform**: ScholarX Next.js web application with server-only email execution and admin-only diagnostics  
**Project Type**: Full-stack web application with domain service, route handlers, persistence, and optional worker loop  
**Performance Goals**: Final accepted or failed status within 60 seconds for 99% of valid transactional requests; fallback acceptance within 2 minutes when primary is down and Gmail is healthy; process 5,000 transactional email requests in 15 minutes for 50,000-user campaign spikes  
**Constraints**: No secrets in source code or client bundles; no server-only imports in Client Components; no public caching of personalized email status; route handlers stay thin; no duplicate accepted sends for the same idempotent request; preserve current Better Auth email flows; retry processing must use row-level locking or optimistic concurrency  
**Scale/Scope**: Production-safe for 50,000+ ScholarX users; transactional and operational platform emails first; no marketing campaign system in v1; supports authentication, course, scholarship, admin, and certificate workflows over time

OTP and password-reset message content stays owned by the auth layer and Better Auth callbacks. The new email delivery service is the transport and durability boundary: it receives already-rendered subject/body content, records the request, applies idempotency and fallback rules, and sends through the configured providers. v1 does not introduce a separate template engine or template storage layer.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                  | Status | Plan Response                                                                                                                      |
| ------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Proper Architecture & SOLID Patterns       | PASS   | Use domain service, narrow repository and provider ports, strategy/fallback channel selection, and typed factory wiring.           |
| Uncompromising Code Quality & Type Safety  | PASS   | Define explicit request, result, status, provider, and failure-category types; no raw provider responses leak into callers.        |
| Rigorous Testing Standards                 | PASS   | Cover validation, idempotency, fallback ordering, provider error classification, route authorization, and Better Auth integration. |
| Premium User Experience Consistency        | PASS   | Any admin diagnostics use existing admin shell and table/detail patterns rather than introducing a separate UI system.             |
| Performance, Scalability & Maintainability | PASS   | Store durable records with indexed lookups, bounded retries, attempt history, and no long provider work in public rendering paths. |

## Project Structure

### Documentation (this feature)

```text
specs/010-email-sending-service/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── email-service-contract.md
│   ├── admin-email-operations-api.md
│   └── provider-webhook-contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── app/
│   └── api/
│       └── admin/
│           └── email-deliveries/
│               ├── route.ts
│               └── [deliveryId]/
│                   ├── route.ts
│                   └── retry/
│                       └── route.ts
├── db/
│   └── schema/
│       └── email-db.schema.ts
├── domain/
│   └── email/
│       ├── application/
│       │   ├── email-delivery.service.ts
│       │   ├── email-delivery.service.test.ts
│       │   ├── email-delivery.schemas.ts
│       │   └── email-error-classifier.ts
│       ├── contracts/
│       │   ├── email-delivery.repository.ts
│       │   ├── email-provider.ts
│       │   └── email-types.ts
│       ├── factory/
│       │   └── email-service.factory.ts
│       └── infrastructure/
│           ├── db/
│           │   ├── drizzle-email-delivery.repository.ts
│           │   └── drizzle-email-delivery.repository.test.ts
│           └── providers/
│               ├── nodemailer-email-provider.ts
│               └── nodemailer-email-provider.test.ts
├── lib/
│   └── email.ts
└── worker/
    ├── email-delivery-worker.ts
    └── email-delivery-worker.test.ts

drizzle/
└── migrations for email delivery records, attempts, and events
```

**Structure Decision**: Email delivery is cross-cutting infrastructure with product-level reliability requirements, so core rules belong in `src/domain/email`. The existing `src/lib/email.ts` remains as the stable server-only compatibility facade for Better Auth and current callers, but delegates to the domain service. Admin-only diagnostics live under admin API routes and must never be imported by public routes or Client Components.

## Phase 0 Research

Research is captured in [research.md](./research.md). Key resolved decisions:

| Topic               | Decision                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider strategy   | Keep Nodemailer and create two configured provider adapters: primary ScholarX mailbox first, Gmail fallback second.                                  |
| Send semantics      | Treat provider acceptance as "sent/accepted"; model later bounce or complaint as a separate delivery event.                                          |
| Reliability loop    | Use durable delivery records and attempt rows before and after provider calls; process pending/retryable records through a bounded loop.             |
| Worker execution    | Use a managed Node.js worker or scheduled cron drain, not request-bound background work, for retry processing.                                       |
| Concurrency control | Claim retry rows atomically with PostgreSQL row locking using `FOR UPDATE SKIP LOCKED`; keep an optimistic state/version guard on state transitions. |
| Idempotency         | Require stable idempotency keys from callers or derive deterministic keys for compatibility facade calls.                                            |
| Observability       | Emit structured counters and latency histograms for delivery outcomes, providers, categories, retry depth, fallback usage, and circuit state.        |
| Circuit breaker     | Wrap each provider with closed/open/half-open protection to avoid hammering a dead provider.                                                         |
| Rate limiting       | Use a PostgreSQL-backed sliding-window counter for v1 because PostgreSQL is already required; Redis can replace it later behind a port.              |
| Secret management   | Rotate leaked mailbox credential and load all provider credentials from private environment configuration.                                           |

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md) defines `email_deliveries`, `email_delivery_attempts`, and `email_delivery_events`.
- [contracts/email-service-contract.md](./contracts/email-service-contract.md) defines the internal service boundary used by Better Auth and future product workflows.
- [contracts/admin-email-operations-api.md](./contracts/admin-email-operations-api.md) defines admin-only status, detail, and retry route behavior.
- [contracts/provider-webhook-contract.md](./contracts/provider-webhook-contract.md) defines bounce/complaint ingestion with verification and event idempotency.
- [quickstart.md](./quickstart.md) documents configuration, verification, and test commands.

## Architecture

### Domain Flow

1. Caller submits a typed email request to the email service or compatibility facade.
2. Service validates recipient, sender identity, subject, body, category, and idempotency key.
3. Service creates or reuses a durable delivery record for the idempotent request.
4. Delivery loop atomically claims the record before any provider call.
5. Delivery loop records the primary provider attempt before calling the provider.
6. If primary is accepted, delivery stops and records attempt completion plus delivery acceptance in one transaction.
7. If primary fails with a fallback-eligible category, Gmail fallback is attempted only when fallback policy, rate limits, and circuit state allow it.
8. If all eligible channels fail, delivery records `failed` or `retry_scheduled` depending on retry allowance.
9. Admin/internal status reads use normalized delivery records, not raw provider errors.

### OTP And Message Content Boundary

- Better Auth continues to render OTP and password-reset copy in `src/lib/auth.ts` and passes that rendered content into the delivery facade.
- The delivery service treats OTP emails as `auth_otp` requests with category-aware idempotency keys and rate-limit context, but it does not generate the template text itself.
- If ScholarX later needs richer branded templates, that work should land as a separate content rendering layer ahead of the delivery service, not inside the transport layer.

### Ports And Patterns

- **Strategy**: `EmailProvider` adapters implement primary and Gmail channels behind the same interface.
- **Repository**: `EmailDeliveryRepository` owns delivery, attempt, and event persistence.
- **Factory**: `createEmailDeliveryService` wires repository, provider strategy order, clock, logger, and configuration.
- **Policy**: `EmailRetryPolicy` and `EmailFallbackPolicy` decide whether to retry, fallback, fail fast, or stop.
- **Circuit Breaker**: `ProviderCircuitBreaker` protects each provider during sustained failures with closed, open, and half-open states.
- **Metrics Port**: `EmailMetricsSink` emits counters and histograms through the existing telemetry layer without coupling service logic to Sentry.
- **DTO Mapper**: Repository maps raw rows into stable delivery DTOs before services and route handlers consume them.

The factory must accept a typed `EmailServiceConfig` object from the app bootstrap layer. It must not read `process.env` directly. Environment parsing belongs in infrastructure/bootstrap code so the factory and service remain unit-testable without global environment setup.

Circuit breaker state must be shared across all worker and web instances through `email_provider_circuit_states`. A process-local circuit breaker is not acceptable for production because one worker opening the circuit must stop other workers from hammering the same unhealthy provider.

### Status Model

```text
queued
  ├─ sending
  │   ├─ accepted
  │   │   ├─ delivered     optional later event
  │   │   ├─ bounced       optional later event
  │   │   └─ complained    optional later event
  │   ├─ retry_scheduled
  │   └─ failed
  └─ cancelled
```

Accepted means the sending provider accepted responsibility for the message. Delivered, bounced, complained, and deferred are later provider-reported events and must not be implied unless observed.

### Provider Configuration

Use two logical provider configs:

- `primary`: ScholarX verified mailbox path, matching the currently working external test behavior.
- `gmail_fallback`: Gmail sender credentials, disabled unless all required configuration exists and fallback is explicitly enabled.

Required configuration categories:

- primary host, port, secure mode, username, password, from address
- Gmail host, port, secure mode, username, app password or approved credential, from address
- global fallback enablement flag
- delivery loop limits: max attempts, provider timeout, retry delay, and per-category rate limit
- worker lease duration, retry batch size, stale sending timeout, circuit breaker threshold, circuit cooldown, and half-open probe limit

### Worker Execution Model

V1 must use a managed Node.js worker or scheduled cron execution that is independent of user-facing route lifetimes. Request-bound background processing is not acceptable for delayed retries because Next.js serverless or edge executions can be terminated before the retry loop completes.

Allowed v1 execution options:

- **Preferred**: dedicated Node.js worker process using the existing `src/worker` boundary and deployment process management.
- **Acceptable**: scheduled cron job that invokes a bounded drain command every minute, with each run claiming a fixed batch and exiting cleanly.
- **Deferred**: external queue or `pg-boss` style scheduler, only if the deployment platform already supports it.

The worker must:

- claim rows with `FOR UPDATE SKIP LOCKED` inside a transaction before sending
- use a lease expiration or `lockedUntil` guard so crashed workers do not permanently strand records
- respect provider circuit state and rate limits before each attempt
- process bounded batches to avoid monopolizing the database pool
- expose drain-run metrics for claimed, sent, failed, retried, skipped-by-circuit, and skipped-by-rate-limit counts

### Persistence Requirements

Migrations must add:

- `email_deliveries` with unique idempotency key per category/caller scope.
- `email_delivery_attempts` with one row per provider attempt.
- `email_delivery_events` for later provider events such as bounce or complaint.
- `email_provider_circuit_states` to track closed/open/half-open state per provider.
- `email_rate_limits` to enforce caller/category/recipient sliding-window limits.
- Indexes for admin list filters, request identifier lookup, status queue selection, recipient hash lookup, and stale retry discovery.

The delivery table should store recipient and subject hashes for diagnostics, with raw recipient stored only if required for resend and support workflows. Full message body persistence is not required for v1 unless retry-after-process-restart is a launch requirement; if persisted, it must be access-controlled and excluded from routine logs.

Concurrency requirements:

- Retry selection must use PostgreSQL row-level locking with `FOR UPDATE SKIP LOCKED` or an equivalent optimistic update that atomically changes state from retryable to sending.
- `markSending` must fail with a conflict when the row is no longer claimable.
- `finishAttempt` and `markAccepted` must be one repository transaction so an accepted attempt cannot leave the parent delivery stuck in `sending`.
- The retry selector must repair or skip deliveries stuck in `sending` when an accepted attempt already exists.
- `lockedBy`, `lockedAt`, `lockedUntil`, and `stateVersion` fields are required to support crash recovery and conflict detection.

### Observability Contract

Emit these structured counters:

- `email_delivery_requested_total` by category
- `email_delivery_accepted_total` by category and provider
- `email_delivery_failed_total` by category, provider, and failure category
- `email_delivery_fallback_attempted_total` by category and reason
- `email_delivery_retry_scheduled_total` by category and retry depth
- `email_delivery_bounced_total` by category and provider
- `email_delivery_complained_total` by category and provider
- `email_provider_circuit_open_total` by provider
- `email_rate_limited_total` by category and limit scope

Emit these histograms:

- `email_provider_latency_ms` by provider and outcome
- `email_delivery_end_to_end_latency_ms` by category and final status
- `email_worker_batch_duration_ms`
- `email_retry_depth`

Required alerts:

- primary and fallback both failing above threshold for 5 minutes
- fallback usage above threshold for 10 minutes
- provider circuit open
- retry backlog age above 2 minutes for transactional categories
- duplicate-send guard conflict above zero

### Integration Plan

1. Rotate the leaked primary mailbox credential and remove hardcoded secrets from the external test script before using it again.
2. Add email domain contracts, schemas, explicit retry/fallback policy interfaces, circuit breaker port, metrics port, and fake providers.
3. Add Drizzle schema and migration for delivery, attempts, and events.
4. Add row-claiming repository methods with `FOR UPDATE SKIP LOCKED`, lease fields, state-version checks, and accepted-attempt repair logic.
5. Implement repository and service with primary-first, Gmail-fallback strategy order.
6. Refactor `src/lib/email.ts` to call the new service while preserving the existing `sendEmail` export for Better Auth.
   - Keep OTP subject/body generation in the auth callback layer; only the transport path changes.
7. Update Better Auth OTP and password reset callers to pass category and idempotency context where available.
8. Add admin-only status/list/detail/retry route handlers.
9. Add provider webhook route stubs for bounce/complaint ingestion with signature verification and idempotent event insertion.
10. Add managed worker/cron drain using bounded batches, leases, circuit breaker checks, and rate-limit checks.
11. Add structured telemetry with sanitized metadata only.
12. Add tests for service behavior, repository persistence, route authorization, worker concurrency, webhook ingestion, and auth email compatibility.

## Testing Strategy

Unit tests:

- request validation and email normalization
- idempotency key reuse and duplicate prevention
- primary success without fallback
- primary retryable failure followed by Gmail success
- primary non-retryable configuration/auth failure behavior
- full failure classification
- timeout handling and retry scheduling
- sanitized error logging
- retry policy and fallback policy decisions
- circuit breaker closed/open/half-open transitions
- rate-limit decision behavior

Repository tests:

- delivery creation and lookup by request identifier
- unique idempotency enforcement
- attempt ordering
- event append and current status update
- queue selection only returns eligible retry records
- concurrent retry selectors do not claim the same delivery
- stale `sending` rows are reclaimed only after lease expiration
- accepted attempt plus delivery accepted update is transactional
- stuck delivery with existing accepted attempt is repaired without a duplicate provider call

Route tests:

- admin list requires admin authorization
- admin detail excludes secret/provider-private data
- retry endpoint refuses accepted deliveries unless explicitly allowed by policy
- provider webhook rejects missing or invalid signatures
- provider webhook deduplicates repeated provider event IDs
- standard error envelope for missing, unauthorized, invalid, and rate-limited requests

Integration tests:

- Better Auth password reset still calls the compatibility facade successfully
- Better Auth OTP send records a delivery and does not double-record rate-limit intent
- provider fakes simulate primary outage and fallback acceptance
- worker concurrency test with multiple drain loops over the same retry backlog
- 50,000-user seeded dataset with 5,000-email burst and indexed admin/status queries
- provider outage drill verifies circuit opening, fallback metrics, and retry backlog behavior

Verification commands:

- `pnpm run typecheck`
- `pnpm run test`
- focused email domain tests during implementation

## Rollout Plan

1. Rotate and revoke the leaked mailbox password observed in `email-test/test_email.py`.
2. Add production secrets through private deployment configuration.
3. Deploy the schema migration before enabling the new facade.
4. Deploy the worker/cron process in staging and verify it drains retryable records without a user-facing request.
5. Ship the new service behind a feature flag that keeps current `sendEmail` behavior as the facade boundary.
6. Enable delivery recording for Better Auth emails in staging.
7. Test primary success, primary outage with Gmail fallback, full outage, circuit-open, webhook, and concurrent-worker cases.
8. Run a 50,000-user seed with a 5,000-email transactional burst.
9. Enable production fallback with conservative rate limits.
10. Add admin diagnostics after service records are stable.
11. Remove or quarantine the old ad hoc Python test once the quickstart verification path replaces it.

## Risk And Mitigation

| Risk                                                     | Impact                                                             | Mitigation                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Hardcoded mailbox credential is already exposed          | Account compromise and sender reputation damage                    | Rotate immediately, remove from files, and configure providers through private environment only.   |
| Fallback sends duplicates after uncertain primary result | Users receive duplicate transactional emails                       | Persist attempt state, stop after provider acceptance, and require idempotency keys.               |
| Gmail fallback damages deliverability if overused        | Lower sender reputation                                            | Use fallback only for eligible failures, rate-limit by category, and alert on high fallback rate.  |
| Provider acceptance is mistaken for inbox delivery       | Misleading support/debugging                                       | Model accepted vs delivered/bounced separately in status and UI.                                   |
| Storing full message bodies increases privacy risk       | PII exposure                                                       | Avoid body persistence in v1 unless needed for durable retries; log only hashes and safe metadata. |
| Auth email flow regresses                                | Users cannot verify or reset accounts                              | Preserve `sendEmail` facade and add compatibility tests before replacing internals.                |
| Multiple workers claim the same retryable delivery       | Duplicate OTP or password-reset emails                             | Use `FOR UPDATE SKIP LOCKED`, lease fields, state-version guards, and concurrency tests.           |
| Worker process is request-bound and killed mid-retry     | SLA misses and stuck sending records                               | Use a managed Node.js worker or scheduled cron drain independent of page requests.                 |
| Provider outage creates thundering herd                  | Database and provider pressure during incidents                    | Use circuit breaker state, bounded batches, provider cooldown, and backlog alerts.                 |
| Metrics are ad hoc logs                                  | Outages are hard to detect and success criteria cannot be measured | Define counters, histograms, labels, and alerts before implementation.                             |
| Bounce/complaint support is only a data table            | FR-011 cannot work in production                                   | Add webhook contracts, signature verification, provider event IDs, and idempotent insertion.       |

## Post-Design Constitution Check

| Principle                                  | Status | Design Response                                                                              |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------- |
| Proper Architecture & SOLID Patterns       | PASS   | Provider, repository, policy, and service boundaries remain narrow and substitutable.        |
| Uncompromising Code Quality & Type Safety  | PASS   | Contracts require typed statuses, categories, failures, and service results.                 |
| Rigorous Testing Standards                 | PASS   | Plan includes unit, repository, route, and integration tests for critical paths.             |
| Premium User Experience Consistency        | PASS   | Admin diagnostics reuse existing admin shell patterns and expose clear operational outcomes. |
| Performance, Scalability & Maintainability | PASS   | Indexed storage, bounded retries, and sanitized telemetry support production operation.      |

## Complexity Tracking

No constitution violations. The dedicated domain module and persistence are justified by idempotency, fallback correctness, observability, and credential/security requirements.

## Production Readiness Gate

Implementation must not start the worker loop until these P0/P1 items are complete:

- P0: retry claiming uses row-level locking or optimistic atomic state transition.
- P0: worker execution model is selected and documented for the target deployment.
- P1: retry/fallback policy interfaces are contracted.
- P1: attempt completion and delivery acceptance are transactional.
- P1: structured metrics are implemented through a narrow metrics port.
- P1: provider webhook ingestion is stubbed with signature verification and idempotent event insertion.
- P1: factory accepts typed config and does not read `process.env`.
- P1: provider circuit breaker implementation reads and writes shared database-backed circuit state, not only process-local memory.
- P2: compatibility facade idempotency derivation is implemented per category so legitimate repeated password reset requests are not blocked.
- P2: monitoring alert rules are configured in the selected telemetry sink for failed-delivery and circuit-open metrics.

Target post-update dimension scores:

| Dimension          | Target |
| ------------------ | ------ |
| SOLID principles   | 9/10   |
| Scalability        | 8.5/10 |
| Maintainability    | 9/10   |
| Performance        | 8.5/10 |
| Security & privacy | 9/10   |
| Testability        | 9/10   |
| Observability      | 8.5/10 |
| Design patterns    | 9/10   |
