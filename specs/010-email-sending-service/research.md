# Research: Production Email Sending Service

## Decision: Use Nodemailer Provider Adapters For Primary And Gmail Fallback

**Rationale**: The project already depends on Nodemailer and has a working `src/lib/email.ts` helper. The external Python test proves the primary ScholarX mailbox path works, but the production app should keep email sending in the existing TypeScript/Next.js server boundary. Nodemailer supports both the primary mailbox provider and Gmail SMTP-style sending without adding a new dependency.

**Alternatives considered**:

- Keep the Python script as the production sender: rejected because it lives outside the app boundary, hardcodes secrets, lacks status persistence, and would create a second runtime to operate.
- Add a third-party email API dependency immediately: rejected for v1 because the requested path is primary mailbox plus Gmail fallback and the app already has Nodemailer.
- Use Gmail as default: rejected because the requested behavior and sender reputation strategy require the verified ScholarX channel first.

## Decision: Record Provider Acceptance Separately From Later Delivery Events

**Rationale**: Sending providers can confirm that a message was accepted for delivery, but that is not the same as proving inbox placement. Production status must be honest: accepted, failed before acceptance, bounced, complained, or delivered only when the provider reports the later event.

**Alternatives considered**:

- Mark accepted messages as delivered: rejected because it creates false confidence and bad support diagnostics.
- Track only failures: rejected because operators need positive evidence for accepted messages and fallback decisions.

## Decision: Durable Delivery Records With Attempt History

**Rationale**: The current helper returns a message ID or throws, which is not enough for production operations. A durable delivery record plus attempt rows provides traceability, retry safety, support lookups, and fallback audits.

**Alternatives considered**:

- Log-only observability: rejected because logs are not a reliable source of truth for user support or idempotency.
- Store only the final status: rejected because fallback behavior requires attempt-level evidence.

## Decision: Database-Backed Retry Loop Before Introducing A Queue Dependency

**Rationale**: The project already uses PostgreSQL and Drizzle. A DB-backed queue/status loop is enough for transactional email v1 and avoids adding infrastructure before volume requires it. The design keeps the processing boundary explicit so a dedicated queue can replace the selector later. The retry selector must use PostgreSQL row-level locking with `FOR UPDATE SKIP LOCKED` or an equivalent optimistic atomic update so multiple workers cannot claim the same delivery.

**Alternatives considered**:

- Send synchronously only: rejected because temporary failures and retry scheduling need durable state.
- Add a message queue immediately: rejected because no current production queue standard is established in this repo and it would add operational scope beyond the first release.

## Decision: Use Managed Worker Or Cron Drain, Not Request-Bound Background Work

**Rationale**: Delayed retries must not depend on a user-facing request staying alive. Next.js route handlers can be terminated by platform timeouts, so v1 needs a managed Node.js worker process or scheduled cron drain that runs independently, claims bounded batches, and exits cleanly.

**Alternatives considered**:

- Fire retries from route handlers after responding: rejected because serverless and edge environments do not guarantee completion.
- Persistent infinite loop inside the web server: rejected because it couples background processing to request serving and risks duplicate workers on scaled web instances.
- Full queue infrastructure on day one: deferred unless the deployment platform already provides it.

## Decision: Add Circuit Breaker Around Each Provider

**Rationale**: Health checks alone do not prevent thundering herd behavior during outages. A circuit breaker stops normal traffic to a failing provider after a threshold, allows limited half-open probes after cooldown, and protects both the provider and the shared database pool. The circuit state must be database-backed so all web and worker instances observe the same open/half-open/closed state.

**Alternatives considered**:

- Check provider health before every send: rejected because it doubles provider calls and can fail the same way as send attempts.
- Rely only on retry backoff: rejected because many workers can still hammer the same dead provider concurrently.
- Process-local circuit state only: rejected because one worker can open its circuit while other workers continue sending to the failed provider.

## Decision: Use PostgreSQL-Backed Rate Limits For V1

**Rationale**: PostgreSQL is already required and sufficient for initial transactional volume. A sliding-window counter table avoids adding Redis operational scope now while still enforcing caller/category/recipient limits. The limiter must be behind a port so Redis token buckets can replace it later without service changes.

**Alternatives considered**:

- No service-level rate limiting: rejected because runaway callers can damage sender reputation.
- Redis token bucket immediately: reasonable later, but rejected for v1 to avoid new infrastructure unless existing deployment already depends on Redis.

## Decision: Define Structured Metrics Before Implementation

**Rationale**: The stated success criteria depend on measurable delivery outcomes, fallback rates, retry depth, latency, circuit state, and backlog age. Logs alone are not enough; the service needs named counters and histograms emitted through a narrow metrics port.

**Alternatives considered**:

- Sentry error logs only: rejected because they are searchable but not sufficient for SLA tracking or rate-based alerts.
- Admin table queries as metrics: rejected because operational alerts need continuous aggregated signals.

## Decision: Stub Provider Webhook Ingestion In V1

**Rationale**: Bounce and complaint support requires an inbound route with signature verification, event idempotency, and provider payload normalization. Even if a provider is not wired on day one, the route contract and mapper prevent FR-011 from becoming a data-only placeholder.

SMTP caveat: raw SMTP through Nodemailer does not itself provide HTTP webhooks. Provider events require either a hosted SMTP provider that exposes webhook callbacks or a separate NDR/bounce mailbox processing path. If the primary provider is only raw SMTP in v1, primary-provider bounce/complaint events will not arrive through the HTTP webhook until the provider integration supports it.

**Alternatives considered**:

- Manual bounce review only: rejected because it does not satisfy provider-reported delivery events.
- Store raw provider webhook payloads: rejected because raw payloads can contain sensitive data and provider-specific noise.

## Decision: Stable Idempotency Keys Are Required

**Rationale**: Email fallback creates real duplicate-send risk when a provider accepts a message but the network response is lost. A stable request identifier lets the service deduplicate requests and preserve a single delivery record.

**Alternatives considered**:

- Best-effort duplicate checks by recipient and subject: rejected because two legitimate emails can share those fields.
- No duplicate protection: rejected because transactional emails such as OTP and password reset messages are sensitive to repeats.

## Decision: Rotate And Externalize Credentials Before Implementation

**Rationale**: The inspected Python test contains a hardcoded mailbox password. Production work must start by rotating that credential, removing it from files, and loading credentials only from private deployment configuration.

**Alternatives considered**:

- Reuse the visible credential temporarily: rejected because it is already exposed and cannot be treated as private.
- Store credentials in code comments or local examples: rejected because examples are often copied into source and logs.

## Decision: Preserve `src/lib/email.ts` As Compatibility Facade

**Rationale**: Better Auth currently imports `sendEmail` from `src/lib/email.ts`. Replacing internals while preserving the export minimizes auth regression risk and lets existing callers migrate category/idempotency context incrementally.

**Alternatives considered**:

- Rewrite all email callers at once: rejected because auth email delivery is critical and should be changed behind a stable facade.
- Keep helper untouched and add a separate service: rejected because callers would remain split and observability would be incomplete.
