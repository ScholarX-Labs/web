# Implementation Plan: Certificate Issuance And PDF Pipeline

**Branch**: `008-certificate-pdf-pipeline`  
**Date**: 2026-05-20  
**Spec**: [spec.md](./spec.md)  
**Status**: Planning  
**Scope**: Course completion certificate issuance, public verification, PDF generation, storage, queue-based processing, and legacy certificate schema consolidation.

## 1. Executive Summary

ScholarX will move certificate issuance to one canonical certificate bounded context backed by `certificates.certificates`, Azure Blob Storage, and Azure Service Bus. The current `courses.certificates` table must be treated as legacy and removed after migration because keeping two certificate authorities creates long-term confusion, duplicated business rules, and inconsistent public verification behavior.

The implementation will use a production-grade asynchronous pipeline:

1. Course completion marks the learner eligible.
2. Certificate issuance creates or returns one idempotent canonical certificate record.
3. PDF generation is enqueued through Azure Service Bus.
4. A worker renders the certificate from the approved SVG template and uploads artifacts to Azure Blob Storage.
5. Public certificate pages read the canonical certificate record and expose PDF download once ready.

PDF is the required artifact. PNG preview is optional and should be generated only if product needs a richer public preview or sharing card.

## 2. Current Approach Review

### 2.1 Current Implementation

- Course completion state lives in the courses domain.
- Current certificate issuance code writes to `courses.certificates`.
- Public certificate pages route through `/certificates/[certificateNumber]`.
- The repository and service names already imply certificate-specific behavior, but the implementation is still physically located under the courses domain.
- The project contains an existing certificate template at `public/certificate-template.svg`.
- The database also contains an older `certificates` schema with:
  - `certificates.certificates`
  - `certificates.certificate_jobs`
  - `certificates.certificate_events`
  - `certificates.completion_criteria`

### 2.2 Main Gaps

- Two certificate tables exist, which makes the certificate source of truth ambiguous.
- Current certificates are issued synchronously enough for UI navigation but do not guarantee PDF artifact readiness.
- There is no durable artifact state machine for PDF generation.
- There is no queue-backed worker for scalable rendering.
- There is no Azure Blob Storage adapter for certificate artifacts.
- There is no public download flow for generated PDF files.
- Certificate IDs are currently shorter than ideal for a public verification surface.
- Legacy columns such as `season_number` and `role` are required by the older model but do not belong in every course-completion certificate.
- Certificate services are mixed with course infrastructure, which weakens ownership boundaries.

## 3. Target Architecture

### 3.1 Ownership Model

| Area | Owner | Responsibility |
| --- | --- | --- |
| Course completion eligibility | `src/domain/courses` | Determine whether a learner completed a course and is eligible for a certificate. |
| Certificate issuance | `src/domain/certificates` | Create idempotent certificate records and preserve issuance metadata. |
| Artifact generation | `src/domain/certificates` worker/service | Render PDF/PNG artifacts and upload them to object storage. |
| Public verification | `src/app/(platform)/certificates` + certificate query service | Display public certificate metadata and artifact status. |
| Storage | Azure Blob adapter | Store generated PDF/PNG artifacts outside Postgres. |
| Queueing | Azure Service Bus adapter | Decouple user requests from CPU-heavy rendering work. |
| Legacy migration | Database migration scripts | Backfill canonical certificates and remove `courses.certificates`. |

### 3.2 High-Level Flow

```text
Lesson progress sync
  -> CourseProgressCommandService
  -> course_progress becomes completed
  -> CertificateIssueService.issueForCourseCompletion()
  -> certificates.certificates row created or reused
  -> certificate_artifacts PDF row created or reused
  -> Azure Service Bus message emitted
  -> Certificate worker renders PDF
  -> Azure Blob upload
  -> artifact status becomes ready
  -> public certificate page exposes download
```

### 3.3 Bounded Context Decision

Certificates must become their own bounded context under `src/domain/certificates`.

The courses domain may request certificate issuance, but it must not own certificate persistence, artifact generation, verification, or revocation rules. This preserves the Dependency Inversion Principle and prevents course-specific implementation details from leaking into future certificate sources such as scholarships, programs, internships, or admin-issued certificates.

## 4. Architecture And Design Patterns

### 4.1 Clean Architecture

The certificate module should be organized into contracts, application services, domain policies, and infrastructure adapters.

```text
src/domain/certificates/
  contracts/
  application/
  domain/
  infrastructure/
  factory/
```

Application services depend on contracts. Infrastructure implements those contracts. Route handlers and server actions call application services through factories.

### 4.2 Ports And Adapters

Use explicit ports for external dependencies:

- `CertificateRepository`
- `CertificateArtifactRepository`
- `CertificateEventRepository`
- `CertificateStoragePort`
- `CertificateQueuePort`
- `CertificateRendererPort`
- `CertificateIdGenerator`
- `CertificateClock`

Azure Blob Storage, Azure Service Bus, Drizzle, and the renderer are adapters behind those interfaces. This keeps the core certificate workflow testable without real Azure services.

### 4.3 CQRS

Separate write and read services:

- Command services:
  - `CertificateIssueService`
  - `CertificateArtifactGenerationService`
  - `CertificateRevocationService`
  - `CertificateRegenerationService`
- Query services:
  - `CertificateVerificationQueryService`
  - `CertificateDownloadQueryService`
  - `CertificateArtifactStatusQueryService`

The write path has idempotency, transactions, retries, and queue behavior. The read path should be optimized for public page speed and simple cache semantics.

### 4.4 Repository Pattern

Repositories own Drizzle queries and map database records to application-level types. Application services must not import Drizzle schema, SQL helpers, or database clients directly.

Required repository contracts:

```ts
interface CertificateRepository {
  findByPublicNumber(certificateNumber: string): Promise<CertificateRecord | null>;
  findBySource(input: CertificateSourceKey): Promise<CertificateRecord | null>;
  createIssued(input: CreateCertificateInput): Promise<CertificateRecord>;
  markRevoked(input: RevokeCertificateInput): Promise<CertificateRecord>;
}

interface CertificateArtifactRepository {
  findRequiredArtifact(input: ArtifactKey): Promise<CertificateArtifactRecord | null>;
  createPending(input: CreateArtifactInput): Promise<CertificateArtifactRecord>;
  markGenerating(input: MarkGeneratingInput): Promise<boolean>;
  markReady(input: MarkReadyInput): Promise<void>;
  markFailed(input: MarkFailedInput): Promise<void>;
}
```

### 4.5 Unit Of Work

Issuance must use one database transaction for:

- Certificate lookup or insert.
- Required artifact lookup or insert.
- Certificate event insert.
- Durable queue/outbox record if an outbox table is used.

The transaction must not perform PDF rendering or Azure Blob uploads.

### 4.6 Idempotent Command Pattern

`issueForCourseCompletion(userId, courseId, courseProgressId)` must be idempotent. Repeated calls return the same certificate record and must not create duplicate PDFs, duplicate certificate numbers, or duplicate user-visible events.

Idempotency constraints:

- Unique certificate source key:
  - `(user_id, source_type, source_id)`
- Unique artifact key:
  - `(certificate_id, artifact_type, template_version)`
- Unique public certificate number:
  - `certificate_number`
- Azure Service Bus message ID:
  - `${artifactId}:${artifactType}:${templateVersion}`

### 4.7 State Machine Pattern

Certificate and artifact status transitions should be explicit and validated.

Certificate status:

```text
PENDING -> ISSUED -> REVOKED
PENDING -> REVOKED
ISSUED -> CLAIMED
CLAIMED -> REVOKED
```

Artifact status:

```text
pending -> generating -> ready
pending -> generating -> failed
failed -> pending
failed -> generating
```

The application service should reject invalid transitions instead of relying on UI behavior or worker assumptions.

### 4.8 Outbox / Queue Worker Pattern

Use Azure Service Bus for distributed processing. Use a durable database record for artifact generation state. If Service Bus publish fails after the transaction commits, a repair job can re-enqueue `pending` artifacts.

Recommended V1 behavior:

- Create artifact row in `pending`.
- Publish Azure Service Bus message after commit.
- Scheduled repair job re-enqueues stale `pending` or retryable `failed` artifacts.
- Worker uses artifact row locking or conditional update to claim work.

### 4.9 Strategy Pattern

Use strategies for artifact rendering:

- `PdfCertificateRenderStrategy`
- Optional `PngCertificateRenderStrategy`

This allows the template renderer to evolve without rewriting issuance logic.

### 4.10 Adapter Pattern

Use adapters for Azure dependencies:

- `AzureBlobCertificateStorageAdapter`
- `AzureServiceBusCertificateQueueAdapter`

Application code should not import Azure SDK clients directly.

### 4.11 Specification Pattern

Eligibility rules should remain outside the certificate module. The certificate module should receive an already-approved source completion snapshot, not recalculate course completion.

For example:

```ts
type CertificateEligibilitySnapshot = {
  sourceType: "course_completion";
  sourceId: string;
  userId: string;
  recipientName: string;
  title: string;
  completedAt: Date;
  completionSource: "live" | "backfill_approximate";
  ruleVersion: string;
};
```

### 4.12 Domain Event Pattern

Emit internal domain events for auditability:

- `certificate.issued`
- `certificate.artifact_generation_requested`
- `certificate.artifact_generation_started`
- `certificate.artifact_ready`
- `certificate.artifact_failed`
- `certificate.revoked`
- `certificate.downloaded`
- `certificate.verified`

Events should be stored in `certificates.certificate_events` or an equivalent certificate-owned event table.

## 5. SOLID Application

| Principle | Implementation Requirement |
| --- | --- |
| Single Responsibility | Course progress computes completion. Certificate issuance creates records. Artifact workers generate files. Storage adapters upload files. Route handlers only validate and delegate. |
| Open / Closed | New certificate sources, artifact types, renderers, and storage providers are added through interfaces and strategies, not by rewriting issuance flow. |
| Liskov Substitution | Test adapters and Azure adapters must implement the same storage and queue contracts without changing service behavior. |
| Interface Segregation | Split read repositories, write repositories, renderer, queue, storage, and ID generation. Do not create one large certificate service interface. |
| Dependency Inversion | Application services depend on certificate contracts. Drizzle, Azure SDKs, and rendering libraries live only in infrastructure adapters. |

## 6. Technology Decisions

### 6.1 Canonical Table

Use `certificates.certificates` as the canonical certificate table.

Reasons:

- Certificate issuance is its own domain, not a course table concern.
- Future certificates may come from programs, scholarships, cohorts, admin awards, or external partnerships.
- Public verification should not depend on course schema.
- Artifact state, revocation, events, and download behavior belong to a certificate domain.

`courses.certificates` should be migrated and removed after cutover.

### 6.2 Azure Blob Storage

Use Azure Blob Storage for PDF and optional PNG artifacts.

Reasons:

- Generated certificates are binary artifacts and should not live in Postgres.
- Azure credits are available.
- Blob Storage integrates well with Azure Service Bus, Managed Identity, Azure Monitor, lifecycle policies, private containers, and SAS URLs.

Recommended container:

```text
certificates
```

Recommended key format:

```text
certificates/{yyyy}/{mm}/{certificateNumber}/{templateVersion}/certificate.pdf
certificates/{yyyy}/{mm}/{certificateNumber}/{templateVersion}/preview.png
```

### 6.3 Azure Service Bus

Use Azure Service Bus instead of BullMQ.

Reasons:

- Managed queue with durable messaging and dead-letter queues.
- Better fit for Azure-hosted production infrastructure.
- No Redis operations burden.
- Native duplicate detection and delayed delivery.
- Works well for background certificate rendering at 50k+ learner scale.

BullMQ is still a strong tool for teams already operating Redis and persistent Node workers, but it adds infrastructure responsibility ScholarX does not need if the platform is leaning into Azure.

### 6.4 Worker Runtime

Recommended V1 worker runtime:

```text
Azure Container Apps worker consuming Azure Service Bus
```

Reasons:

- PDF rendering can require browser or native rendering dependencies.
- Container Apps gives more control over fonts, Chromium, native libraries, memory, and concurrency than a serverless function.
- It can scale based on Service Bus queue depth.

Azure Functions can still be used for lightweight repair jobs or status maintenance, but the main renderer should be containerized unless the final renderer prototype proves it does not need browser/native dependencies.

### 6.5 PDF Renderer

Use a renderer behind `CertificateRendererPort`.

Preferred V1 implementation:

- Compose certificate data into an HTML/SVG document using the existing `certificate-template.svg`.
- Render to PDF with Playwright/Chromium inside the worker container.
- Optionally render PNG preview from the same source.

This prioritizes visual fidelity and supports the current template. The renderer must be deterministic and snapshot-testable.

### 6.6 Certificate ID Strategy

Use two IDs:

- Internal primary key: UUID.
- Public certificate number: 128-bit random identifier encoded in Crockford Base32.

Recommended format:

```text
SX-7M4K-M2QD-8F4P-T6VN-X1RA
```

Rules:

- Generate from cryptographically secure random bytes.
- Keep at least 128 bits of entropy.
- Use a unique database constraint.
- Retry on collision, even though collisions are practically impossible.
- Do not encode user ID, course ID, timestamp, or internal DB IDs.
- Treat certificate numbers as opaque public identifiers, not cryptographic proofs.

## 7. Database Plan

### 7.1 Canonical Certificate Schema Changes

Update `certificates.certificates` to support course-completion and future certificate sources.

Required additions:

```sql
alter table certificates.certificates
  add column if not exists certificate_number text,
  add column if not exists source_type text,
  add column if not exists source_id text,
  add column if not exists course_progress_id uuid,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists rule_version text not null default 'course_completion_v1',
  add column if not exists completion_source text not null default 'live';
```

Required normalization:

- Backfill `certificate_number` from `short_id` where safe.
- Prefer `certificate_number` for new code.
- Keep `short_id` temporarily as a legacy alias during migration.
- Make `season_number` nullable or move it to metadata for course certificates.
- Make `role` nullable or move it to metadata for course certificates.
- Keep `is_public` with default `true` for course-completion certificates.

Required indexes:

```sql
create unique index concurrently if not exists certificates_certificate_number_uq
  on certificates.certificates (certificate_number);

create unique index concurrently if not exists certificates_source_uq
  on certificates.certificates (user_id, source_type, source_id)
  where revoked_at is null;

create index concurrently if not exists certificates_public_lookup_idx
  on certificates.certificates (certificate_number, status)
  where is_public = true;
```

### 7.2 Artifact Table

Add a certificate artifact table instead of storing only one `pdf_storage_key` on the certificate row.

```sql
create table if not exists certificates.certificate_artifacts (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references certificates.certificates(id) on delete cascade,
  artifact_type text not null,
  template_version text not null,
  status text not null default 'pending',
  storage_provider text not null default 'azure_blob',
  storage_container text,
  storage_key text,
  content_type text,
  byte_size bigint,
  checksum_sha256 text,
  error_code text,
  error_message text,
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (certificate_id, artifact_type, template_version)
);
```

Allowed artifact types:

- `pdf`
- `png_preview`

Allowed artifact statuses:

- `pending`
- `generating`
- `ready`
- `failed`

### 7.3 Legacy Table Removal

`courses.certificates` must be removed only after:

1. All rows are backfilled into `certificates.certificates`.
2. New writes go only to `certificates.certificates`.
3. Public certificate pages read only canonical certificates.
4. A production verification query confirms no reads or writes hit `courses.certificates`.
5. A rollback backup or snapshot exists.

### 7.4 Backfill Requirements

Backfill must be explicit and auditable.

For each row in `courses.certificates`:

- Create a canonical certificate row.
- Preserve the old certificate number in metadata.
- Preserve issued/completed timestamps.
- Set `source_type = 'course_completion'`.
- Set `source_id = course_id` unless a better course-progress source ID exists.
- Set `completion_source = 'legacy_migration'`.
- Set `metadata.legacy_table = 'courses.certificates'`.

Backfill should be run first on a production replica or staging copy.

## 8. Domain And File Structure Plan

### 8.1 New Certificate Domain

Create:

```text
src/domain/certificates/
  application/
    certificate-issue.service.ts
    certificate-artifact-generation.service.ts
    certificate-verification-query.service.ts
    certificate-download-query.service.ts
    certificate-revocation.service.ts
  contracts/
    certificate.repository.ts
    certificate-artifact.repository.ts
    certificate-event.repository.ts
    certificate-storage.port.ts
    certificate-queue.port.ts
    certificate-renderer.port.ts
    certificate-id-generator.ts
  domain/
    certificate-status.ts
    certificate-artifact-status.ts
    certificate-source.ts
    certificate-number.ts
    certificate-template.ts
    certificate-errors.ts
  infrastructure/
    db/
      next-certificate.repository.ts
      next-certificate-artifact.repository.ts
      next-certificate-event.repository.ts
    azure/
      azure-blob-certificate-storage.adapter.ts
      azure-service-bus-certificate-queue.adapter.ts
    rendering/
      playwright-certificate-renderer.adapter.ts
  factory/
    certificate-services.factory.ts
```

### 8.2 Route And UI Files

Expected route structure:

```text
src/app/api/courses/[courseId]/certificate/route.ts
src/app/api/certificates/[certificateNumber]/artifact-status/route.ts
src/app/(platform)/certificates/[certificateNumber]/page.tsx
src/app/(platform)/certificates/[certificateNumber]/download/route.ts
```

Expected UI components:

```text
src/components/certificates/certificate-public-page.tsx
src/components/certificates/certificate-download-button.tsx
src/components/certificates/certificate-artifact-status.tsx
src/components/courses/course-completion-celebration.tsx
```

## 9. Issuance Flow

### 9.1 Command Contract

```ts
type IssueCourseCertificateInput = {
  userId: string;
  courseId: string;
  courseProgressId: string;
  completedAt: Date;
  recipientName: string;
  courseTitle: string;
  completionSource: "live" | "backfill_approximate" | "legacy_migration";
};
```

### 9.2 Command Steps

1. Validate the course progress row is completed.
2. Build a certificate eligibility snapshot.
3. Start a database transaction.
4. Look up existing certificate by `(userId, sourceType, sourceId)`.
5. If found, ensure required PDF artifact exists.
6. If not found, generate certificate number and insert certificate.
7. Insert `certificate.issued` event if this is a new certificate.
8. Create required PDF artifact in `pending` status if absent.
9. Commit the transaction.
10. Publish Azure Service Bus message for pending artifact.
11. Return certificate number and artifact status to the UI.

### 9.3 Completion UI Behavior

When the last lesson completes:

- Show course completion animation.
- Show certificate generation pending state.
- Call certificate issuance endpoint.
- Redirect to public certificate page if issuance succeeds.
- On certificate page, show:
  - Certificate metadata immediately.
  - PDF generation status while artifact is pending/generating.
  - Download CTA once PDF is ready.
  - Retry guidance if generation fails.

Eligibility and artifact readiness are separate states. The learner can be certificate-eligible before the PDF file exists.

## 10. Worker Flow

### 10.1 Message Shape

```json
{
  "schemaVersion": 1,
  "artifactId": "uuid",
  "certificateId": "uuid",
  "certificateNumber": "SX-7M4K-M2QD-8F4P-T6VN-X1RA",
  "artifactType": "pdf",
  "templateVersion": "scholarx-v1",
  "requestedAt": "2026-05-20T00:00:00.000Z"
}
```

### 10.2 Worker Steps

1. Receive Service Bus message.
2. Load artifact and certificate by ID.
3. Reject if certificate is revoked.
4. Skip if artifact is already `ready`.
5. Claim artifact by conditional update from `pending` or `failed` to `generating`.
6. Render PDF from template and certificate data.
7. Upload PDF to Azure Blob.
8. Store content type, byte size, checksum, and storage key.
9. Mark artifact `ready`.
10. Insert `certificate.artifact_ready` event.
11. Complete Service Bus message.

### 10.3 Failure Handling

On render or upload failure:

- Increment attempts.
- Store sanitized error code and message.
- Mark artifact `failed` or reschedule with `next_attempt_at`.
- Abandon or defer Service Bus message according to retry policy.
- Move messages to DLQ after the retry budget is exhausted.

Retry budget:

- Immediate retry for transient network failures.
- Exponential backoff with jitter.
- Maximum 5 attempts before DLQ.
- Admin repair action can requeue failed artifacts.

## 11. Azure Infrastructure Requirements

### 11.1 Azure Blob Storage

Required configuration:

- Storage account.
- Private container named `certificates`.
- Managed Identity or least-privilege connection string for the worker.
- Blob lifecycle policy for non-current previews if template regeneration creates superseded artifacts.
- Content type metadata:
  - PDF: `application/pdf`
  - PNG: `image/png`

Public access policy:

- Public certificate page is public.
- Blob container should remain private.
- Downloads should use short-lived SAS URLs or stream through a controlled route.

Recommended V1:

- Stream downloads through Next.js route for access logging and consistent public behavior.
- Use short-lived SAS only if direct-download performance becomes a bottleneck.

### 11.2 Azure Service Bus

Required configuration:

- Queue: `certificate-artifact-generation`
- Dead-letter queue enabled.
- Duplicate detection enabled.
- Lock duration tuned for renderer runtime.
- Max delivery count: 5.
- Message TTL: at least 7 days.

Recommended operational alerts:

- DLQ message count > 0 for 5 minutes.
- Queue age p95 > 10 minutes.
- Worker failure rate > 5% over 5 minutes.
- Artifact generation p95 > 60 seconds.

## 12. API Plan

### 12.1 Issue Certificate

```http
POST /api/courses/:courseId/certificate
```

Auth:

- Required.

Behavior:

- Validates signed-in user.
- Validates completed course progress.
- Calls `CertificateIssueService.issueForCourseCompletion`.
- Returns existing certificate if already issued.

Response:

```json
{
  "certificateNumber": "SX-7M4K-M2QD-8F4P-T6VN-X1RA",
  "certificateUrl": "/certificates/SX-7M4K-M2QD-8F4P-T6VN-X1RA",
  "artifactStatus": "pending"
}
```

### 12.2 Public Certificate Page

```http
GET /certificates/:certificateNumber
```

Auth:

- Not required.

Behavior:

- Uses canonical certificate query service.
- Returns 404 for missing, private, or revoked certificates unless product decides revoked certificates should show a public revoked page.
- Shows PDF status and download CTA.

### 12.3 Artifact Status

```http
GET /api/certificates/:certificateNumber/artifact-status
```

Auth:

- Not required for public certificates.

Response:

```json
{
  "certificateNumber": "SX-7M4K-M2QD-8F4P-T6VN-X1RA",
  "pdf": {
    "status": "ready",
    "downloadUrl": "/certificates/SX-7M4K-M2QD-8F4P-T6VN-X1RA/download"
  }
}
```

### 12.4 PDF Download

```http
GET /certificates/:certificateNumber/download
```

Auth:

- Not required for public certificates.

Behavior:

- Finds canonical certificate.
- Verifies certificate is public and not revoked.
- Verifies PDF artifact is ready.
- Streams PDF from Azure Blob or redirects to a short-lived SAS URL.
- Records `certificate.downloaded` event without blocking the response.

## 13. Performance And Scale Plan

### 13.1 Scale Targets

The system should support:

- 50k+ learners.
- Burst completions after course campaigns.
- Thousands of certificate page views without touching heavy rendering paths.
- Background PDF rendering without delaying lesson completion UX.

### 13.2 Performance Rules

- Never render PDF in the lesson completion request.
- Never store binary PDFs in Postgres.
- Never query by unindexed certificate number.
- Use one idempotent certificate row per learner/source.
- Use queue depth to scale workers horizontally.
- Use Blob Storage for binary distribution.
- Keep public certificate page reads narrow and indexed.

### 13.3 Expected SLOs

| Operation | Target |
| --- | --- |
| Certificate issuance endpoint p95 | < 1 second, excluding cold starts |
| Public certificate page p95 | < 500 ms server time |
| PDF generation p95 | < 60 seconds |
| PDF download start p95 | < 2 seconds |
| Duplicate certificate creation | 0 |
| Artifact generation success rate | >= 99% after retries |

## 14. Security And Privacy

### 14.1 Public Certificate Safety

Public certificate pages may expose:

- Recipient display name.
- Course/program title.
- Completion date.
- Issued date.
- Certificate number.
- ScholarX issuer metadata.

Public pages must not expose:

- Internal user ID.
- Internal course progress ID.
- Email address.
- Session information.
- Storage account details.
- Raw Azure Blob keys unless they are intentionally public-safe.

### 14.2 Storage Security

- Keep Blob container private.
- Use Managed Identity where possible.
- Use Key Vault or platform secret management for connection strings if Managed Identity is not available.
- Use short-lived SAS URLs only when needed.
- Log access with certificate number and artifact ID, not private user payloads.

### 14.3 Certificate Number Security

Certificate numbers are opaque public IDs. They are not cryptographic signatures and must be verified by database lookup.

Do not generate certificate numbers from:

- User IDs.
- Course IDs.
- Sequential IDs.
- Timestamps.
- HMAC prefixes that imply cryptographic verification without a full signed-payload design.

## 15. Observability

### 15.1 Structured Logs

Required fields:

- `requestId`
- `certificateId`
- `certificateNumber`
- `artifactId`
- `artifactType`
- `userId`
- `sourceType`
- `sourceId`
- `status`
- `attempt`
- `durationMs`
- `errorCode`

Do not log recipient email or full certificate metadata.

### 15.2 Metrics

Required metrics:

- `certificate.issue.count`
- `certificate.issue.duration_ms`
- `certificate.issue.duplicate.count`
- `certificate.artifact.generate.count`
- `certificate.artifact.generate.duration_ms`
- `certificate.artifact.generate.failure.count`
- `certificate.artifact.ready.count`
- `certificate.download.count`
- `certificate.verify.count`
- `certificate.queue.depth`
- `certificate.queue.oldest_message_age_ms`
- `certificate.dlq.count`

### 15.3 Tracing

Add OpenTelemetry spans around:

- Certificate issuance request.
- Certificate repository transaction.
- Artifact enqueue.
- Worker message handling.
- Rendering.
- Blob upload.
- Artifact status update.
- PDF download.

## 16. Testing Strategy

### 16.1 Unit Tests

Cover:

- Certificate number generation format and uniqueness retry behavior.
- Issuance idempotency.
- Status transition validation.
- Artifact retry policy.
- Template data mapping.
- Public/private/revoked certificate visibility rules.

### 16.2 Repository Tests

Cover:

- Unique source constraint.
- Unique certificate number constraint.
- Artifact unique key.
- Concurrent issue requests for the same course completion.
- Backfill conflict behavior.

### 16.3 Route Tests

Cover:

- Auth required for issuance.
- No auth required for public certificate page/status/download.
- 404 for missing certificate.
- 409 or equivalent for not completed course.
- Existing certificate returned on duplicate issuance request.
- Download unavailable while PDF is pending.

### 16.4 Worker Tests

Cover:

- Ready artifact is skipped.
- Pending artifact is claimed once.
- Render failure increments attempts.
- Blob upload failure marks failure and retries.
- Revoked certificate does not generate a public artifact.
- DLQ path after retry budget.

### 16.5 E2E Tests

Cover:

- Complete final lesson.
- Completion animation appears.
- Certificate issuance starts.
- Public certificate page opens.
- PDF status becomes ready.
- Download returns a valid PDF.

### 16.6 Load And Reliability Tests

Before production rollout:

- Simulate burst issuance for at least 50k certificates.
- Verify queue drains within target time.
- Verify no duplicate certificate numbers.
- Verify DB indexes support public lookup.
- Verify worker memory usage under render concurrency.

## 17. Migration Phases

### Phase 0: Inventory And Safety

- Count rows in both certificate tables.
- Export legacy `courses.certificates` snapshot.
- Confirm existing public URLs and certificate numbers.
- Document all code paths importing course certificate repository/service.

Exit gate:

- Inventory complete.
- Rollback snapshot exists.
- Backfill script reviewed.

### Phase 1: Schema Expansion

- Add missing canonical columns to `certificates.certificates`.
- Add `certificates.certificate_artifacts`.
- Add indexes concurrently where production requires it.
- Make legacy-only columns nullable where needed.

Exit gate:

- Migration runs on staging and production replica.
- Schema supports both old and new reads.

### Phase 2: Certificate Domain Introduction

- Create `src/domain/certificates`.
- Add contracts and Drizzle repositories.
- Add certificate number generator.
- Add issue/query/download services.
- Keep old course certificate implementation untouched until tests pass.

Exit gate:

- Unit and repository tests pass.
- No route cutover yet.

### Phase 3: Azure Adapters And Worker

- Add Azure Blob adapter.
- Add Azure Service Bus adapter.
- Add renderer adapter.
- Add worker entrypoint.
- Add worker-local tests.
- Add infrastructure configuration documentation.

Exit gate:

- Worker can generate a PDF locally/staging.
- Artifact reaches Azure Blob.
- Status transitions to `ready`.

### Phase 4: Backfill

- Backfill `courses.certificates` into `certificates.certificates`.
- Create missing PDF artifact rows as `pending` where PDFs do not exist.
- Enqueue artifacts for generation.
- Store migration metadata.

Exit gate:

- Backfilled row count matches expected count.
- Public lookup works for backfilled certificates.
- No duplicate canonical certificates.

### Phase 5: Route Cutover

- Update issue route to use `CertificateIssueService`.
- Update public certificate page to use canonical query service.
- Update download route to use Blob artifact.
- Update final-lesson completion UI to handle artifact pending/ready/failed.

Exit gate:

- New completions write only canonical certificates.
- Public certificate pages no longer depend on `courses.certificates`.
- End-to-end final lesson to PDF download works.

### Phase 6: Legacy Removal

- Remove old course certificate repository and service.
- Remove `courses.certificates` Drizzle schema exports.
- Drop `courses.certificates` table in a dedicated migration.
- Remove temporary dual-read logic.

Exit gate:

- Search confirms no code references to legacy table.
- Production monitoring shows canonical path healthy.

## 18. Rollback Plan

Before dropping `courses.certificates`, rollback is straightforward:

- Disable new certificate route feature flag.
- Revert route handlers to legacy course certificate service.
- Stop worker.
- Keep canonical rows for later inspection.

After dropping `courses.certificates`, rollback requires:

- Restoring database snapshot or recreating legacy rows from canonical metadata.
- Therefore, table drop must happen only after stable production operation and backup verification.

## 19. Implementation Checklist

### Schema

- [ ] Add canonical certificate columns.
- [ ] Add artifact table.
- [ ] Add public lookup indexes.
- [ ] Add source uniqueness indexes.
- [ ] Make `season_number` and `role` nullable or metadata-only.
- [ ] Backfill legacy certificate rows.
- [ ] Drop `courses.certificates` after cutover.

### Domain

- [ ] Create certificate bounded context.
- [ ] Add repository contracts.
- [ ] Add queue/storage/render ports.
- [ ] Add certificate issue service.
- [ ] Add artifact generation service.
- [ ] Add public query/download services.
- [ ] Add revocation service.

### Infrastructure

- [ ] Add Drizzle repositories.
- [ ] Add Azure Blob adapter.
- [ ] Add Azure Service Bus adapter.
- [ ] Add renderer adapter.
- [ ] Add worker entrypoint.
- [ ] Add repair/requeue job.

### UI And Routes

- [ ] Update issue route.
- [ ] Update certificate public page.
- [ ] Add PDF download route.
- [ ] Add artifact status route.
- [ ] Add pending/failed artifact UI.
- [ ] Keep final-lesson celebration and certificate generation state separate.

### Testing

- [ ] Unit tests.
- [ ] Repository concurrency tests.
- [ ] Route tests.
- [ ] Worker tests.
- [ ] Migration dry-run tests.
- [ ] End-to-end certificate download test.
- [ ] Load test for 50k issuance/rendering scenario.

## 20. Definition Of Done

The feature is complete when:

- `certificates.certificates` is the only source of truth.
- `courses.certificates` has been removed after migration.
- Course completion issues certificates idempotently.
- Public certificate pages are accessible without authentication.
- Every issued course certificate has a required PDF artifact or a visible generation failure state.
- PDFs are stored in Azure Blob Storage.
- PDF generation runs asynchronously through Azure Service Bus.
- Workers are retry-safe and duplicate-safe.
- Certificate IDs use high-entropy public identifiers.
- Observability exists for issuance, rendering, downloads, queue depth, and failures.
- Tests cover idempotency, concurrency, public verification, download behavior, and worker retries.
