# Feature Specification: Certificate Issuance And PDF Pipeline

**Feature Branch**: `008-certificate-pdf-pipeline`  
**Created**: 2026-05-20  
**Status**: Draft specified for implementation planning  
**Related Feature**: [007-course-completion-state](../007-course-completion-state/spec.md)

---

## Summary

Unify ScholarX certificate issuance around one canonical certificate domain and restore production-grade certificate artifact generation.

The current completion implementation issues certificates into `courses.certificates`, while the database already contains a richer legacy certificate schema under `certificates.*`:

- `certificates.certificates`
- `certificates.certificate_jobs`
- `certificates.certificate_events`
- `certificates.completion_criteria`

The target state is:

1. `courses.course_progress` owns course completion and certificate eligibility.
2. `certificates.certificates` owns issued credentials, verification identity, revocation, and certificate artifacts.
3. PDF/PNG generation is represented as durable certificate artifacts, not as transient UI output.
4. `courses.certificates` is migrated out and then removed after validation.

---

## Problem Statement

The system currently has two certificate concepts:

- `courses.certificates`: newly introduced by course completion work.
- `certificates.certificates`: existing legacy credential table with fields for PDF/PNG storage, jobs, events, claim tokens, and public verification.

Keeping both as active sources creates production risk:

- Engineers may issue certificates into the wrong table.
- Verification pages may read from one table while PDF generation writes to another.
- Revocation and audit history can diverge.
- Support cannot reliably answer whether a certificate is valid, generated, claimed, or revoked.
- Future certificate types outside courses become harder to model.

---

## Current State

### Active Code

Current code issues and verifies certificates from `courses.certificates` through:

- `src/domain/courses/application/certificate.service.ts`
- `src/domain/courses/infrastructure/db/next-certificate.repository.ts`
- `src/app/api/courses/[courseId]/certificate/route.ts`
- `src/app/(platform)/certificates/[certificateNumber]/page.tsx`

### Existing Database Schema

The dev database contains the legacy certificate schema:

```text
certificates.certificates
certificates.certificate_jobs
certificates.certificate_events
certificates.completion_criteria
```

Important legacy fields in `certificates.certificates`:

- `short_id`
- `recipient_name`
- `recipient_email`
- `course_id`
- `program_name`
- `season_number`
- `role`
- `completion_date`
- `status`
- `issued_at`
- `claimed_at`
- `revoked_at`
- `revoked_reason`
- `signature_hex`
- `pdf_storage_key`
- `png_storage_key`
- `claim_token`
- `claim_token_expires_at`
- `is_public`

Current dev row counts found during review:

```text
certificates.certificates          0
certificates.certificate_jobs      0
certificates.certificate_events    0
certificates.completion_criteria   0
courses.certificates               1
```

### Existing Assets

Static certificate templates exist:

- `public/certificate-template.svg`
- `public/certificate-template.png`

No active PDF generation service, worker, route, or package was found in application code.

### Current Codebase Constraints

Implementation must account for the current repository shape:

- `src/db/schema/courses-db.schema.ts` currently exports the only Drizzle certificate table: `courses.certificates`.
- No `src/db/schema/certificates-db.schema.ts` file currently exists.
- `drizzle.config.ts` currently includes only the `auth`, `public`, and `courses` schemas in `schemaFilter`.
- The public certificate page currently lives at `src/app/(platform)/certificates/[certificateNumber]/page.tsx` and must remain publicly reachable.
- Current certificate issuance is also called from `src/actions/course.actions.ts` after final lesson completion, not only from `POST /api/courses/{courseId}/certificate`.
- Azure Blob Storage, Azure Service Bus, and Playwright/Chromium dependencies are not currently installed. They must be isolated to server/worker infrastructure and never imported into Client Components or public page rendering code.

Therefore, the implementation must add first-class Drizzle definitions for the `certificates` schema and update migration configuration before application code can safely target `certificates.certificates`.

---

## Goals

- Establish `certificates.certificates` as the single canonical issued-certificate table.
- Keep `courses.course_progress` as the single source of course completion and certificate eligibility.
- Migrate any records from `courses.certificates` into `certificates.certificates`.
- Stop writing new certificate records to `courses.certificates`.
- Add a production-grade artifact model for PDF and PNG outputs.
- Generate certificate artifacts idempotently.
- Preserve verification by opaque public certificate ID.
- Preserve auditability through certificate events.
- Support retryable generation jobs without duplicate certificates.
- Keep certificate generation independent of frontend state.

---

## Non-Goals

- Redesign the visual certificate template in this phase.
- Add blockchain or third-party credential verification.
- Add email delivery as part of initial artifact generation.
- Generate certificates automatically for every historical/backfilled completion without explicit review.
- Replace `courses.course_progress`; that table remains the authoritative eligibility source.

---

## Principal Architecture Decision

### Canonical Ownership

| Domain | Owns | Does Not Own |
|---|---|---|
| Courses | Lesson progress, course progress, completion eligibility | Issued credential identity, PDF files, claim tokens |
| Certificates | Issuance, verification, revocation, generated artifacts, certificate events | Lesson counting, course completion rules |

### Required Rule

`courses.course_progress.certificate_eligible_at` means the learner may receive a certificate.

`certificates.certificates.issued_at` means the certificate exists.

`pdf_storage_key` and `png_storage_key` mean generated artifacts exist for the issued certificate.

These are separate states and must not be collapsed into one boolean.

### Final Technical Choices

| Decision | Choice | Rationale |
|---|---|---|
| Canonical certificate table | Use `certificates.certificates` | It already models jobs, events, public IDs, PDF/PNG keys, claims, revocation, and batch generation. `courses.certificates` duplicates ownership and must be removed after migration. |
| Course certificate table | Deprecate and drop `courses.certificates` | Keeping two issued-certificate tables will confuse future engineers and can split verification from artifact generation. |
| Certificate visibility | Public verification pages and public certificate metadata | Product requirement: certificates are intended for sharing. Public pages must not expose private internal IDs or non-public learner data. |
| PDF generation | Required | Learners must be able to download a PDF certificate. |
| PNG preview | Optional V1 | Useful for social preview/share cards, but not required for certificate validity. |
| Certificate template | Use `public/certificate-template.svg` as V1 template source | The uploaded template exists in the repo and should be treated as `certificateTemplateVersion = "scholarx-v1"`. |
| `season_number` | Remove from required course-certificate model; keep nullable/deprecated only for legacy cohort certificates | Course completion certificates do not need season semantics. Required `season_number` creates confusion unless a certificate source is explicitly cohort/season-based. |
| `role` | Remove from required course-certificate model; keep nullable/deprecated only for legacy role-based certificates | Course certificates represent completion, not participant role. |
| Artifact storage | Azure Blob Storage primary | ScholarX will use Azure credits for certificate artifacts. Keep storage behind a port so R2 or S3-compatible storage remains replaceable later. |
| Queue/job model | DB outbox/job table plus managed queue worker | `certificates.certificate_jobs` should be the durable source of truth. A managed queue wakes workers. Do not block lesson completion requests on PDF rendering. |
| Queue provider | Azure Service Bus | It aligns with Azure Blob Storage, Azure credits, managed operations, dead-lettering, duplicate detection, competing consumers, and Azure Functions/Container Apps workers. BullMQ is acceptable only if ScholarX deliberately operates Redis plus persistent Node workers. |
| Certificate public ID | Internal UUID primary key plus 128-bit random public ID | Public IDs must be opaque, non-sequential, human-shareable, and collision-protected by a unique index. |

---

## Scale Constraints

The certificate pipeline must handle ScholarX growth to at least **50,000 learners** without architectural changes.

### Scale Assumptions

- 50,000+ registered learners.
- Certificate generation may spike after course cohorts, campaigns, or admin-triggered backfills.
- PDF generation is CPU and memory heavier than normal API requests.
- Certificate verification pages may be publicly shared and read many more times than they are generated.
- Artifact downloads are public and can create high egress if stored on a provider with outbound bandwidth charges.

### Required Capacity Targets

| Area | Target |
|---|---|
| Certificate issue request | p95 under 1 second when only creating/returning certificate row and enqueueing artifact job |
| Verification page lookup | indexed single-row lookup by public ID |
| Artifact generation | asynchronous, horizontally scalable workers |
| Queue durability | at-least-once processing with idempotent job handlers |
| Batch generation | support at least 50,000 queued certificate artifact jobs |
| Duplicate prevention | unique indexes and idempotent commands, not in-memory locks |
| Public downloads | served from object storage/CDN, not from application memory |
| Backpressure | queue depth and worker concurrency must be configurable |

### Scaling Rules

- Do not render PDFs inside the progress sync transaction.
- Do not render PDFs inside the certificate issue DB transaction.
- Do not store PDF/PNG binary data in Postgres.
- Do not scan all certificate rows for verification or download.
- Do not use a single cron request that tries to generate thousands of PDFs in one process.
- Do not use `courses.certificates` as a cache or shadow table after cutover.
- Workers must be safe to run concurrently.
- Job handlers must acquire work idempotently and tolerate duplicate delivery.
- Artifact generation must use bounded concurrency to protect CPU and memory.

### Batch Generation

Batch generation is required for:

- admin-reviewed backfilled completions
- cohort/season certificate campaigns
- regeneration after template bug fixes
- retrying failed artifact jobs

Batch generation must use:

1. `certificates.certificate_jobs` as the durable batch/job record.
2. Per-certificate artifact jobs or job items, either in a new table or represented as events plus artifact rows.
3. A managed queue message per certificate artifact generation task.
4. Worker concurrency configured by environment.
5. Retry with exponential backoff and dead-letter handling.

BullMQ decision:

- Do not choose BullMQ as the default for this app while the deployment target is serverless/Cloudflare.
- BullMQ requires Redis and persistent workers. It is strong for Node worker fleets, but it adds infrastructure ScholarX does not currently operate in this repo.
- If ScholarX later standardizes on a Node worker service with Redis, BullMQ can implement the queue port without changing domain services.

Managed queue decision:

- Use Azure Service Bus with Azure Blob Storage for the first production implementation.
- Keep the application service behind `CertificateArtifactQueue` and `CertificateArtifactStorage` ports so either provider can be swapped.

---

## User Stories

### Learner

As a learner who completes a course, I want a certificate to be issued and generated reliably so I can view, download, and share it.

### Public Verifier

As someone viewing a certificate link, I want to verify whether the certificate is valid, revoked, and issued by ScholarX.

### Admin / Support

As support staff, I want to inspect certificate metadata, generation status, and audit events so I can resolve learner issues.

### Operations

As an operator, I want certificate generation failures to be retryable and observable without creating duplicate credentials.

---

## Functional Requirements

### Certificate Issuance

- The system must issue certificates only from server-confirmed `courses.course_progress`.
- The system must not trust client-provided completion data for certificate eligibility.
- The system must create at most one active certificate per learner/course completion source.
- Certificate issuance must be idempotent.
- Reissuing an already-created certificate for the same learner/course must return the existing certificate.
- The certificate must snapshot learner name, learner email when available, course title, completion date, rule version, and completion source.
- The certificate public ID must be opaque and safe to expose in URLs.

### Canonical Table

- New certificate writes must target `certificates.certificates`.
- `courses.certificates` must become read-only during migration and then be dropped after verification.
- Application repositories must not expose both certificate tables to application services.
- The domain must expose one `ICertificateRepository` port backed by the canonical table.

### Artifact Generation

- The system must generate PDF artifacts for issued certificates.
- The system should generate PNG preview artifacts when supported by the rendering pipeline; PNG is optional for V1.
- Artifact generation must be idempotent per certificate and artifact type.
- Generated artifacts must be stored in object storage, not in Postgres.
- The certificate record must store stable storage keys, not raw binary content.
- Artifact generation may run asynchronously.
- The UI must handle issued-but-generating, ready, failed, and revoked states.
- PDF generation is required before the UI shows a download action.
- The verification page may be available before the PDF artifact is ready.

### Jobs

- Certificate artifact generation must be represented by a durable job or event record.
- A failed job must be retryable.
- Retrying a job must not create a duplicate certificate.
- Job progress must record total, processed, failed, started, completed, and error summary when operating in batch mode.

### Events And Audit

- The system must record certificate lifecycle events:
  - `ISSUED`
  - `ARTIFACT_GENERATION_STARTED`
  - `ARTIFACT_GENERATION_SUCCEEDED`
  - `ARTIFACT_GENERATION_FAILED`
  - `VIEWED`
  - `DOWNLOADED`
  - `CLAIMED`
  - `REVOKED`
- Events must include actor information when available.
- Events may include metadata for error details, storage keys, request IDs, and generation duration.

### Verification Page

- Public verification must read from the canonical certificate table.
- Public verification must never require authentication.
- The page must show whether the certificate is valid or revoked.
- The page must show immutable issuance metadata.
- The page must not expose private learner data beyond the certificate snapshot intended for public display.

### Download

- Download links must use signed URLs or controlled proxy routes if artifacts are private.
- Because certificates are public by product decision, public download URLs are allowed only for certificate artifacts and only if they do not expose mutable storage internals.
- Preferred implementation: controlled download route that redirects to a short-lived signed URL or public CDN URL.
- Download routes must validate certificate status before returning or redirecting to a file.

### Revocation

- Revoked certificates must remain queryable.
- Revoked certificates must not be hidden as 404.
- The verification page must display revoked state.
- Revocation must store actor, reason, and timestamp.
- Artifact download may be blocked for revoked certificates unless product decides otherwise.

---

## Non-Functional Requirements

### Reliability

- Issuance must be idempotent under double-clicks, retries, and concurrent final-lesson completions.
- Artifact generation must be retryable without duplicate files or duplicate certificates.
- Storage upload failures must not roll back the issued certificate.
- A certificate without artifacts is valid but not yet downloadable.

### Performance

- Certificate verification must be an indexed single-row lookup by public ID.
- Certificate issue path must not synchronously perform slow rendering if it risks blocking progress sync UX.
- Artifact generation should happen asynchronously or behind a short bounded timeout.
- Object storage keys must be deterministic enough for idempotency or stored atomically after upload.

### Security

- Certificate public IDs must be unguessable.
- Claim tokens must be hashed at rest if used.
- Artifact download must avoid leaking private storage credentials.
- HMAC signatures, if used, must have a documented threat model and rotation strategy.
- Verification must be DB-first; signatures are supplemental, not the only source of truth.

### Maintainability

- Use clean architecture boundaries:
  - certificate application service
  - certificate repository port
  - artifact renderer port
  - storage adapter port
  - event repository port
- Do not import Drizzle schema into application services.
- Do not generate PDFs from React pages directly.
- Do not let course progress services know storage or PDF rendering details.

### Observability

- Emit structured logs for issuance and artifact generation.
- Emit metrics for issue count, generation count, generation failures, retry count, and latency.
- Add traces around issuance, render, upload, and DB update operations.
- Alert on certificate issue or artifact generation error spikes.

---

## Data Model Requirements

### Canonical Certificate

The canonical certificate table must support:

```text
id
short_id / certificate_number
user_id
recipient_name
recipient_email
source_type
source_id
course_id
course_progress_id
program_name
completion_date
status
issued_at
claimed_at
revoked_at
revoked_reason
signature_hex
pdf_storage_key
png_storage_key
metadata
is_public
created_at
updated_at
```

If the existing legacy table is reused, add missing fields through migrations rather than creating another table.

Required additions if not present:

- `source_type varchar(32)` default `course_completion`
- `source_id uuid`
- `course_progress_id uuid`
- `metadata jsonb`
- `rule_version varchar(32)`
- `completion_source varchar(32)`
- `certificate_number varchar(64)` if `short_id` is not renamed

Deprecated or source-specific fields:

- `season_number` must become nullable or move into metadata for source types that actually need seasons.
- `role` must become nullable or move into metadata for source types that actually need participant roles.
- Existing values must be preserved during migration, but new course completion certificates must not require these fields.

Recommended canonical public identifier:

- Keep internal `id uuid primary key`.
- Add `certificate_number varchar(64) unique not null`.
- Keep `short_id` only as a legacy alias if needed for old links.
- Public routes should use `certificate_number`.

### Artifact Model

Preferred long-term model:

```text
certificates.certificate_artifacts
  id
  certificate_id
  artifact_type        -- pdf | png
  status               -- pending | generating | ready | failed
  storage_key
  content_type
  byte_size
  checksum_sha256
  error_code
  error_message
  generated_at
  created_at
  updated_at
```

Compatibility model:

- Keep `pdf_storage_key` and `png_storage_key` on `certificates.certificates`.
- Add artifact table later when multiple versions/templates are required.

Recommendation:

Use the artifact table if the pipeline will support regeneration, multiple templates, or multiple file types. Use inline storage keys only as a temporary compatibility layer.

### Events

Use `certificates.certificate_events` for append-only audit history.

Required event fields:

```text
id
certificate_id
event_type
actor_id
actor_role
ip_region
user_agent_hash
metadata
occurred_at
```

---

## State Machines

### Certificate Status

```text
PENDING
ISSUED
CLAIMED
REVOKED
```

Allowed transitions:

```text
PENDING -> ISSUED
ISSUED -> CLAIMED
ISSUED -> REVOKED
CLAIMED -> REVOKED
```

Disallowed:

- `REVOKED -> ISSUED`
- `REVOKED -> CLAIMED`
- duplicate active certificate for same user/source

### Artifact Status

```text
pending
generating
ready
failed
```

Allowed transitions:

```text
pending -> generating
generating -> ready
generating -> failed
failed -> generating
ready -> generating   -- only for explicit regeneration
```

---

## API Requirements

### Issue Certificate

`POST /api/courses/{courseId}/certificate`

Behavior:

- Requires authenticated learner.
- Reads `courses.course_progress`.
- Rejects if not eligible.
- Creates or returns canonical certificate.
- Starts artifact generation.
- Returns certificate public URL and artifact status.

Response shape:

```json
{
  "certificate": {
    "id": "uuid",
    "certificateNumber": "SX-...",
    "status": "ISSUED",
    "issuedAt": "2026-05-20T00:00:00.000Z"
  },
  "alreadyIssued": false,
  "certificateUrl": "/certificates/SX-...",
  "artifactStatus": "pending"
}
```

### Certificate Verification

`GET /certificates/{certificateNumber}`

Behavior:

- Public page.
- Reads canonical certificate.
- Shows valid, pending artifacts, or revoked state.
- Shows PDF download CTA only when the PDF artifact is ready.

### Certificate Artifact Download

`GET /certificates/{certificateNumber}/download`

Behavior:

- Public or authenticated based on `is_public`.
- Verifies certificate exists and is not blocked.
- Returns signed URL redirect or streams file.
- Returns `409 ARTIFACT_NOT_READY` if PDF has not been generated.

### Artifact Status

`GET /api/certificates/{certificateNumber}/artifact-status`

Behavior:

- Returns artifact generation state for UI polling.
- Must not expose private storage keys.
- For pending or generating PDFs, clients should poll every 5 seconds and stop automatic polling after 2 minutes.
- Download URLs must be null until the PDF artifact is ready.

---

## Migration Requirements

### Phase 1 - Inventory

- Count rows in both `courses.certificates` and `certificates.certificates`.
- Compare unique keys and certificate identifiers.
- Export a dry-run report before writing migration SQL.
- Confirm whether production contains legacy `certificates.*` rows.

### Phase 2 - Canonical Schema Repair

- Add missing canonical fields to `certificates.certificates`.
- Add artifact table if selected.
- Make legacy course-irrelevant fields nullable:
  - `season_number`
  - `role`
- Add `certificate_number` if the canonical route should not rely on `short_id`.
- Add required unique indexes:
  - unique public certificate number / short ID
  - unique active certificate per `(user_id, source_type, source_id)`
- Add foreign keys where safe.

### Phase 3 - Backfill

- Copy records from `courses.certificates` into `certificates.certificates`.
- Preserve certificate number as public ID.
- Preserve the previous public certificate number as either `certificate_number` or a legacy `short_id` alias so existing public URLs keep resolving.
- Preserve issued timestamp.
- Preserve metadata snapshot.
- Set `source_type = 'course_completion'`.
- Set `source_id = course_progress_id`.
- Set `course_progress_id` from the source row.
- Record migration event in `certificates.certificate_events`.
- Do not generate PDFs during the backfill unless explicitly requested.

### Phase 4 - Repository Cutover

- Update `ICertificateRepository` implementation to read/write `certificates.certificates`.
- Keep route/API contracts stable.
- Keep `courses.certificates` read-only for one release window.
- Refactor every certificate consumer to use the canonical certificate repository:
  - certificate issue route
  - certificate eligibility route
  - certificate verification page
  - certificate download route
  - lesson completion action return payload
  - profile certificate surfaces
  - admin/support certificate surfaces
- Remove imports of `dbCertificates` from `courses-db.schema.ts` after cutover.

### Phase 5 - Drop Legacy Table

- Drop `courses.certificates` only after:
  - production row count matches migrated count
  - verification pages read canonical records
  - no application code references `courses.certificates`
  - rollback window has passed
- Remove `dbCertificates` from `src/db/schema/courses-db.schema.ts`.
- Add a migration comment explaining why `courses.certificates` was dropped.

---

## Rendering Requirements

### Renderer Port

Define a renderer interface:

```ts
interface CertificateRenderer {
  renderPdf(input: CertificateRenderInput): Promise<CertificateArtifactOutput>;
  renderPngPreview?(input: CertificateRenderInput): Promise<CertificateArtifactOutput>;
}
```

Renderer input must use certificate snapshot metadata, not live course/user names.

### Template

- Templates must be versioned.
- `certificateTemplateVersion` must be stored in metadata.
- Regeneration must use the original template version unless an admin explicitly upgrades it.
- V1 template source: `public/certificate-template.svg`.
- V1 output format: PDF required.
- V1 optional output format: PNG preview.
- Dynamic text must be rendered from certificate snapshot metadata:
  - recipient name
  - course/program name
  - completion date
  - certificate number
  - issuer name/title
- Rendering must not depend on live user profile or live course title after issuance.

### Storage

Storage adapter must support:

- upload
- delete or supersede
- signed download URL
- checksum calculation

Object keys should follow:

```text
certificates/{certificateNumber}/{templateVersion}/certificate.pdf
certificates/{certificateNumber}/{templateVersion}/certificate.png
```

Do not date-partition certificate artifact keys. Certificate regeneration may occur months after issuance, and the storage key must remain derivable from immutable certificate identity plus template version. Date-based analysis belongs in artifact metadata, Blob Storage lifecycle rules, and monitoring, not in the key path.

Primary storage provider:

- Azure Blob Storage.
- Reason: ScholarX will use Azure credits for durable certificate PDFs and generated previews.

Alternative provider:

- Cloudflare R2 or S3-compatible storage may implement the same storage port later.
- Do not couple the domain service to Azure SDK, R2, or S3 SDK types.

---

## Certificate ID Strategy

### Requirements

- Public certificate IDs must be opaque.
- IDs must not be sequential.
- IDs must not expose user ID, course ID, or issue timestamp.
- IDs must be short enough for sharing and support calls.
- Collision handling must rely on a unique DB index plus bounded retry.
- Internal references must continue using UUID primary keys.

### Recommended Format

Use a 128-bit cryptographically random identifier encoded with Crockford Base32 and prefixed with `SX`.

Example:

```text
SX-7M4K-M2QD-8F4P-T6VN-X1RA
```

Implementation rule:

```text
certificate_number = "SX-" + base32_crockford(randomBytes(16)).grouped()
```

Why:

- 128 bits gives effectively negligible collision risk at ScholarX scale.
- Random IDs are harder to enumerate than sequential IDs.
- Crockford Base32 avoids visually confusing characters better than raw base64.
- Prefix makes support and log searching easier.
- Hyphen grouping improves readability without changing stored uniqueness.

Do not use:

- database integer sequences
- raw UUIDs in public URLs
- short 8-12 character IDs for long-term public verification
- HMAC-only IDs that require secret rotation to verify

HMAC signatures:

- Optional as `signature_hex`.
- Use only as tamper-evidence metadata.
- Public verification remains DB-first.
- If HMAC is used, store key version and define rotation rules.

---

## SOLID And Design Patterns

| Principle / Pattern | Requirement |
|---|---|
| Single Responsibility | Course completion, certificate issuance, rendering, storage, and verification must live in separate services. |
| Open/Closed | Adding new certificate sources must not rewrite course completion logic. |
| Interface Segregation | Certificate services must depend on small repository, renderer, storage, and event ports. |
| Dependency Inversion | Application services depend on interfaces, not Drizzle, S3, or rendering libraries. |
| Repository | All certificate persistence goes through `ICertificateRepository`. |
| Adapter | R2/S3 and PDF renderer are replaceable infrastructure adapters. |
| State Machine | Certificate and artifact statuses must use explicit allowed transitions. |
| Idempotent Command | Certificate issue and artifact generation commands must be safely retryable. |
| Outbox / Job | Artifact generation should be durable and retryable; inline generation is allowed only as a bounded first step. |
| Mapper | DB rows and public DTOs must be mapped explicitly. |

---

## Observability Requirements

Structured logs:

- `certificate.issue.started`
- `certificate.issue.completed`
- `certificate.issue.failed`
- `certificate.artifact.started`
- `certificate.artifact.completed`
- `certificate.artifact.failed`
- `certificate.verified`
- `certificate.downloaded`
- `certificate.revoked`

Required fields:

- `requestId`
- `userId`
- `courseId`
- `courseProgressId`
- `certificateId`
- `certificateNumber`
- `artifactType`
- `status`
- `errorCode`
- `durationMs`

Metrics:

- `certificate.issue.count`
- `certificate.issue.error_count`
- `certificate.artifact.generation.count`
- `certificate.artifact.generation.error_count`
- `certificate.artifact.generation.duration_ms`
- `certificate.download.count`
- `certificate.verify.count`

Alerts:

- certificate issue error rate > 5% over 5 minutes
- artifact generation error rate > 10% over 5 minutes
- artifact generation p95 latency > 30 seconds over 10 minutes
- pending artifact jobs older than 15 minutes

---

## Security Requirements

- Certificate public IDs must be unguessable.
- Verification pages must not leak internal UUIDs unless product approves.
- Private artifact storage keys must never be returned directly to the browser.
- Signed URLs must have short TTLs.
- Revoked certificates must not generate valid download URLs unless explicitly allowed.
- Claim tokens must be one-time-use or expiring.
- All admin revoke/regenerate actions must be audited.

---

## Acceptance Criteria

- Completing a course issues exactly one canonical certificate row.
- The verification URL reads from `certificates.certificates`.
- The current `courses.certificates` record is migrated successfully.
- New certificate writes no longer target `courses.certificates`.
- A PDF artifact is generated or queued after issuance.
- Failed artifact generation can be retried without duplicate certificate creation.
- Public verification shows valid, pending-artifact, and revoked states correctly.
- Download returns a PDF only when the artifact is ready and allowed.
- Certificate events record issue, artifact generation, verification, download, and revocation.
- Production migration has a dry-run report and rollback plan.
- Tests cover issuance idempotency, migration mapping, verification lookup, artifact status, and revoked behavior.

---

## Testing Requirements

### Unit Tests

- Certificate eligibility adapter reads `course_progress`.
- Certificate issue command is idempotent.
- Certificate number generation is collision-safe with retry.
- Artifact state transitions reject invalid transitions.
- Metadata snapshot uses issued-time values.

### Repository Tests

- Find by certificate number.
- Find by user/source.
- Create canonical certificate.
- Prevent duplicate active certificate.
- Store artifact keys/status.
- Append certificate events.

### Route Tests

- Issue route rejects unauthenticated user.
- Issue route rejects ineligible course progress.
- Issue route returns existing certificate on duplicate request.
- Verification page returns 404 for unknown certificate.
- Verification page renders revoked certificate as revoked.
- Download route returns `409` when artifact is not ready.

### Migration Tests

- `courses.certificates` row maps to canonical row.
- Metadata is preserved.
- Issued timestamp is preserved.
- Duplicate migration is idempotent.
- Migration event is inserted.

### E2E Tests

1. Complete final lesson.
2. Course progress becomes completed.
3. Certificate is issued in canonical table.
4. Artifact generation is queued or completed.
5. Learner opens certificate URL.
6. Learner downloads PDF when ready.
7. Admin revokes certificate.
8. Public verification shows revoked state.

---

## Open Questions

- Should download URLs use public R2 URLs directly or a controlled route that redirects to signed/public CDN URLs?
- Should certificate workers run on Azure Functions or Azure Container Apps?
- Which Azure Blob container access policy should be used for public certificate artifacts?
- Should the artifact model be a separate table in V1, or should V1 write `pdf_storage_key` directly and migrate to artifact rows later?
- What is the final official certificate template version naming scheme after design approval?
- Should claim tokens remain part of the learner flow?

---

## Definition Of Done

This feature is complete when:

- `certificates.certificates` is the only active issued-certificate table.
- `courses.certificates` is removed or formally marked deprecated with no code references.
- Certificate issuance is idempotent and backed by server-confirmed course completion.
- Certificate verification and download routes read from the canonical domain.
- PDF artifact generation is durable, observable, and retryable.
- Certificate lifecycle events are recorded.
- Migration from `courses.certificates` is dry-run, executed, verified, and documented in migration comments.
- TypeScript, ESLint, and automated tests pass.
