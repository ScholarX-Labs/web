# Quickstart: Production Email Sending Service

## Prerequisites

- Rotate the mailbox password that appeared in `C:\Users\dell\Documents\ScholarX\V2\email-test\test_email.py`.
- Remove or quarantine hardcoded credentials from ad hoc test files before sharing or committing them.
- Configure private environment values for the primary provider and Gmail fallback.
- Confirm Gmail fallback uses an approved app password or equivalent production-safe credential, not a personal login password.

## Required Environment Categories

Primary provider:

```text
EMAIL_PRIMARY_HOST
EMAIL_PRIMARY_PORT
EMAIL_PRIMARY_SECURE
EMAIL_PRIMARY_USER
EMAIL_PRIMARY_PASSWORD
EMAIL_PRIMARY_FROM
```

Gmail fallback:

```text
EMAIL_GMAIL_FALLBACK_ENABLED
EMAIL_GMAIL_HOST
EMAIL_GMAIL_PORT
EMAIL_GMAIL_SECURE
EMAIL_GMAIL_USER
EMAIL_GMAIL_PASSWORD
EMAIL_GMAIL_FROM
```

Delivery loop:

```text
EMAIL_PROVIDER_TIMEOUT_MS
EMAIL_MAX_ATTEMPTS
EMAIL_RETRY_DELAY_SECONDS
EMAIL_ADMIN_DIAGNOSTICS_ENABLED
EMAIL_WORKER_LEASE_SECONDS
EMAIL_WORKER_BATCH_SIZE
EMAIL_STALE_SENDING_TIMEOUT_SECONDS
EMAIL_CIRCUIT_FAILURE_THRESHOLD
EMAIL_CIRCUIT_COOLDOWN_SECONDS
EMAIL_CIRCUIT_HALF_OPEN_PROBE_LIMIT
```

## Implementation Verification

Run focused checks during implementation:

```powershell
pnpm run typecheck
pnpm run test
```

Add focused test commands once email tests exist, for example:

```powershell
pnpm run test -- src/domain/email/**/*.test.ts
```

## Implemented Surfaces

- `src/lib/email.ts` remains the stable compatibility facade for Better Auth and current callers.
- `src/domain/email/` owns typed delivery orchestration, provider adapters, policies, persistence contracts, circuit breaking, rate limiting, metrics, and test helpers.
- `src/db/schema/email-db.schema.ts` defines delivery, attempt, event, circuit state, rate-limit, and future batch tables.
- `src/worker/email-delivery-worker.ts` drains retryable deliveries through injected dependencies or production defaults.
- `src/app/api/admin/email-deliveries/` exposes admin-only list, detail, and retry diagnostics.
- `src/app/api/email/provider-events/[provider]/route.ts` accepts verified provider events for later bounce/complaint status updates.

## Manual Staging Drill

1. Configure valid primary provider credentials and disabled Gmail fallback.
2. Send a `system_test` email to an internal recipient.
3. Confirm the delivery record is `accepted` with provider `primary`.
4. Break only the primary provider credentials in staging.
5. Enable Gmail fallback with valid credentials.
6. Send another `system_test` email.
7. Confirm attempt 1 failed on `primary`, attempt 2 was accepted by `gmail_fallback`, and only one email was accepted.
8. Break both providers.
9. Send a third `system_test` email.
10. Confirm final status is `failed` or `retry_scheduled` with sanitized failure categories.

## 50,000-User Scale Drill

1. Seed at least 50,000 users or recipient records in staging.
2. Queue 5,000 transactional `system_test` deliveries over 15 minutes.
3. Run at least two worker instances or two concurrent cron drain invocations.
4. Confirm retry claims do not overlap between workers.
5. Confirm duplicate accepted sends are zero.
6. Confirm 99% of records reach accepted or failed state within 2 minutes.
7. Confirm admin list and request status lookups use indexed queries and remain responsive.
8. Simulate primary provider outage and confirm circuit opens, fallback rate is visible, and unrelated database workflows do not degrade.

## Worker Verification

- Worker or cron drain must run outside user-facing page requests.
- Batch size must be bounded.
- Claimed records must receive a `lockedUntil` lease.
- Crashed-worker simulation must release or reclaim expired leases.
- Concurrent drain runs must not send the same delivery twice.

## Webhook Verification

- Missing signatures are rejected.
- Invalid signatures are rejected.
- Duplicate provider event IDs are accepted idempotently without duplicate event rows.
- Bounce and complaint events update or supplement the parent delivery status.
- Confirm the selected primary SMTP provider supports HTTP delivery webhooks; if it does not, document that v1 primary-provider bounce handling depends on NDR/bounce mailbox processing rather than this webhook route.

## Monitoring Setup

- Configure an alert for `email_delivery_failed_total` when failures exceed the agreed threshold over 5 minutes.
- Configure an alert for `email_provider_circuit_open_total` immediately when any provider circuit opens.
- Configure an alert for retry backlog age above 2 minutes for transactional categories.
- Configure a dashboard showing accepted rate, fallback rate, failure rate by category/provider, provider latency, end-to-end latency, retry depth, and circuit state.
- Verify alert delivery to the selected operational destination before production fallback is enabled.

## Regression Checks

- Password reset email still sends through the `src/lib/email.ts` compatibility facade.
- Email OTP still sends and respects existing rate limits.
- No provider password appears in logs, API responses, delivery records, or committed files.
- Admin email diagnostics require admin authorization.
- Public routes cannot read email delivery diagnostics.
- Circuit breaker opens during sustained provider failure and limits provider calls.
- Structured metrics exist for accepted, failed, fallback, retry, bounce, complaint, latency, retry depth, and circuit state.

## Rollback Strategy

- Keep `src/lib/email.ts` as the stable caller boundary.
- Use a feature flag to switch the facade between legacy direct send and the new delivery service during rollout.
- If production sending regresses, disable Gmail fallback first if it is causing duplicate or reputation issues.
- If the new service regresses auth emails, temporarily switch the facade back to legacy direct send while preserving delivery records for investigation.
