# Data Model: Production Email Sending Service

## EmailDelivery

Represents one intended outbound email request and its current lifecycle state.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Stable delivery identifier. |
| `requestId` | string | yes | Caller-visible request identifier. |
| `idempotencyKey` | string | yes | Prevents duplicate accepted sends for the same logical request. |
| `category` | enum | yes | Examples: `auth_otp`, `password_reset`, `course_application`, `certificate`, `admin_operation`, `system_test`. |
| `status` | enum | yes | `queued`, `sending`, `accepted`, `retry_scheduled`, `failed`, `cancelled`, `delivered`, `bounced`, `complained`. |
| `recipientEmail` | string | conditional | Store only if needed for retry/support; access-controlled. |
| `recipientHash` | string | yes | Used for diagnostics without exposing recipient in logs. |
| `senderIdentity` | string | yes | Logical sender identity, not raw credential. |
| `subjectHash` | string | yes | Safe subject diagnostic. |
| `subjectPreview` | string | optional | Short sanitized preview for admin support if approved. |
| `bodyStorageMode` | enum | yes | `not_stored`, `stored`, `template_reference`. |
| `bodyReference` | string | optional | Template key or secure content reference. |
| `acceptedProvider` | enum | optional | `primary` or `gmail_fallback`. |
| `providerMessageId` | string | optional | Provider reference when available. |
| `failureCategory` | enum | optional | Normalized final failure category. |
| `failureReason` | string | optional | Sanitized reason safe for internal display. |
| `requestedByUserId` | string | optional | User or admin who triggered the email. |
| `requestedBySystem` | string | optional | System workflow name when not user-triggered. |
| `nextAttemptAt` | datetime | optional | Retry loop scheduling. |
| `attemptCount` | number | yes | Total provider attempts. |
| `lockedBy` | string | optional | Worker identifier that currently owns the delivery lease. |
| `lockedAt` | datetime | optional | Time the delivery lease was acquired. |
| `lockedUntil` | datetime | optional | Lease expiration used for crash recovery. |
| `stateVersion` | number | yes | Optimistic concurrency guard for state changes. |
| `batchId` | string | optional | Reserved for future bulk-send parent grouping. |
| `createdAt` | datetime | yes | Request creation time. |
| `updatedAt` | datetime | yes | Last state update time. |
| `acceptedAt` | datetime | optional | First provider acceptance time. |
| `failedAt` | datetime | optional | Final failure time. |

### Validation Rules

- `requestId` must be unique.
- `idempotencyKey` must be unique within caller/category scope.
- `recipientEmail` must be a valid email address when stored or used for sending.
- `category` must be one of the approved values.
- `status` transitions must follow the state machine.
- `acceptedProvider` and `providerMessageId` are allowed only after provider acceptance.
- Raw credentials and provider secrets are never stored.
- A delivery can be claimed only when status is `queued` or `retry_scheduled`, or when status is `sending` and `lockedUntil` has expired.
- State-changing updates must increment `stateVersion`.
- `batchId` is nullable in v1 and exists only to avoid a breaking data model change when admin bulk sends are introduced later.

## EmailDeliveryAttempt

Represents one attempt to send an email through one configured provider.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Stable attempt identifier. |
| `deliveryId` | string | yes | Parent `EmailDelivery`. |
| `attemptNumber` | number | yes | Starts at 1 and increases monotonically per delivery. |
| `provider` | enum | yes | `primary` or `gmail_fallback`. |
| `status` | enum | yes | `started`, `accepted`, `failed`, `timed_out`, `cancelled`. |
| `startedAt` | datetime | yes | Attempt start time. |
| `finishedAt` | datetime | optional | Attempt completion time. |
| `providerMessageId` | string | optional | Provider reference when accepted. |
| `failureCategory` | enum | optional | Sanitized normalized category. |
| `failureReason` | string | optional | Safe diagnostic text. |
| `latencyMs` | number | optional | Attempt duration. |

### Validation Rules

- `(deliveryId, attemptNumber)` must be unique.
- A delivery can have only one accepted attempt.
- Gmail fallback attempt is allowed only after an eligible primary failure.
- Attempts must not store provider passwords, tokens, or raw private response payloads.
- Attempt completion and parent delivery acceptance must be committed in one transaction.

## EmailDeliveryEvent

Represents a later event reported after provider acceptance or a manual operational event.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Stable event identifier. |
| `deliveryId` | string | yes | Parent delivery. |
| `provider` | enum | optional | Provider that reported the event. |
| `eventType` | enum | yes | `delivered`, `bounced`, `complained`, `deferred`, `opened`, `clicked`, `manual_note`. |
| `occurredAt` | datetime | yes | Provider or system event time. |
| `receivedAt` | datetime | yes | Time ScholarX recorded the event. |
| `reasonCategory` | enum | optional | Safe classification for bounce/complaint/failure. |
| `safeDetails` | string | optional | Sanitized operational detail. |

### Validation Rules

- Delivery events must not contain secrets or full provider payloads.
- `opened` and `clicked` events are optional and should be disabled unless tracking is intentionally enabled.
- Bounce or complaint events must update or supplement the delivery's current status.

## SendingChannel

Represents configuration and health for a logical provider.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | enum | yes | `primary` or `gmail_fallback`. |
| `enabled` | boolean | yes | Runtime enablement. |
| `fromAddress` | string | yes | Sender address shown to recipients. |
| `displayName` | string | yes | Human-readable sender display. |
| `timeoutMs` | number | yes | Provider call timeout. |
| `lastHealthStatus` | enum | optional | `healthy`, `degraded`, `unavailable`, `unknown`. |
| `lastCheckedAt` | datetime | optional | Last health check time. |

### Validation Rules

- A channel cannot be enabled unless all required private configuration is present.
- Gmail fallback must be explicitly enabled; missing config means fallback is unavailable, not partially configured.
- Channel health data must not expose credential values.

## ProviderCircuitState

Represents outage protection for each sending channel.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `provider` | enum | yes | `primary` or `gmail_fallback`. |
| `state` | enum | yes | `closed`, `open`, or `half_open`. |
| `failureCount` | number | yes | Consecutive failures counted by policy. |
| `successCount` | number | yes | Consecutive half-open successes. |
| `openedAt` | datetime | optional | Time the circuit opened. |
| `cooldownUntil` | datetime | optional | Earliest time half-open probe is allowed. |
| `lastFailureCategory` | enum | optional | Sanitized failure category that opened or advanced the circuit. |
| `updatedAt` | datetime | yes | Last state update time. |

### Validation Rules

- `open` providers must not receive normal traffic until `cooldownUntil`.
- `half_open` providers must receive only the configured probe count.
- Circuit state changes must emit metrics.

## EmailRateLimitCounter

Represents a PostgreSQL-backed sliding-window rate-limit bucket for v1.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Stable bucket identifier. |
| `scope` | enum | yes | `caller`, `category`, `recipient`, or `caller_category`. |
| `scopeKeyHash` | string | yes | Hashed key for the limited actor/category/recipient. |
| `windowStart` | datetime | yes | Start of the rate-limit window. |
| `windowSeconds` | number | yes | Window size. |
| `count` | number | yes | Requests counted in the window. |
| `expiresAt` | datetime | yes | Cleanup boundary. |
| `updatedAt` | datetime | yes | Last increment time. |

### Validation Rules

- Counter increments must be atomic.
- Raw recipient addresses must not be stored in rate-limit rows.
- Cleanup may remove expired counters after `expiresAt`.

## EmailBatch

Reserved future entity for admin fan-out sends. It is not required for v1 transactional sending, but `EmailDelivery.batchId` must allow a future parent relationship without reshaping delivery records.

### Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | yes | Stable batch identifier. |
| `category` | enum | yes | Category shared by batch deliveries. |
| `requestedByUserId` | string | yes | Admin or operator who triggered the batch. |
| `totalCount` | number | yes | Intended number of child deliveries. |
| `createdAt` | datetime | yes | Batch creation time. |

## State Transitions

```text
queued -> sending
sending -> accepted
sending -> retry_scheduled
sending -> failed
retry_scheduled -> sending
accepted -> delivered
accepted -> bounced
accepted -> complained
queued -> cancelled
retry_scheduled -> cancelled
```

Invalid transitions:

- `accepted` back to `sending` without a new authorized retry request.
- `failed` to `accepted` without creating a new attempt.
- `bounced` or `complained` to `delivered` unless a provider sends a newer authoritative correction and the event history remains intact.
- `sending` to `sending` by another worker while an unexpired lease exists.
- `retry_scheduled` to `sending` without a successful atomic claim.

## Indexes And Constraints

- Unique index on `requestId`.
- Unique index on `(category, idempotencyKey)`.
- Index on `(status, nextAttemptAt, lockedUntil)` for retry loop selection.
- Index on `(lockedUntil)` for stale lease repair.
- Index on `(recipientHash, createdAt DESC)` for support diagnostics.
- Index on `(category, status, createdAt DESC)` for admin filters.
- Unique index on `(deliveryId, attemptNumber)` for ordered attempt history.
- Partial unique index allowing only one accepted attempt per delivery.
- Index on `(deliveryId, occurredAt DESC)` for event history.
- Unique index on provider event identifier for delivery event idempotency when the provider supplies one.
- Unique index on `(provider)` for provider circuit state.
- Unique index on `(scope, scopeKeyHash, windowStart, windowSeconds)` for rate-limit counters.
