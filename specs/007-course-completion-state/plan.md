# Course Completion State - Production Implementation Plan

**Date**: 2026-05-19  
**Last Updated**: 2026-05-20  
**Scope**: Persist lesson completion state in the database, maintain authoritative course completion state, and provide a reliable foundation for certificate generation.  
**System Area**: Courses, lessons, learner progress, certificates.

---

## 1. Executive Summary

The current implementation already has the right starting point: per-user lesson progress is persisted in `courses.lesson_progress`, and the lesson UI can display completed lessons from server data. However, course completion is not yet modeled as a first-class database state. Certificate generation therefore has no authoritative, auditable source of truth.

The production target is:

1. Persist every lesson's learner progress in the database.
2. Derive and persist per-user course completion as a separate aggregate.
3. Make certificate eligibility depend only on server-side authoritative state.
4. Keep UI state optimistic and responsive, but never certificate-authoritative.
5. Document the completion rules so product, backend, and frontend behavior stay aligned.

---

## 2. Current Approach Review

### Existing Database State

Current schema:

- `courses.lesson_progress`
  - `user_id`
  - `lesson_id`
  - `course_id`
  - `completed`
  - `completed_at`
  - `watched_percentage`
  - `last_position`
  - unique index: `(user_id, lesson_id)`
  - index: `(course_id, user_id)`

This is a good foundation for lesson-level persistence.

### Existing Client Flow

Current files:

- `src/hooks/use-lesson-progress.ts`
- `src/app/(platform)/courses/[slug]/lessons/[lessonId]/_components/lesson-client-bridge.tsx`
- `src/actions/course.actions.ts`

Current behavior:

- Playback state is tracked in `localStorage`.
- `watchedPercentage >= 90` marks the lesson completed locally.
- On completion, page hide, visibility change, and unmount, the client calls `syncLessonProgress()`.
- `syncLessonProgress()` validates the authenticated user and delegates to the course domain.

### Existing Domain Flow

Current files:

- `src/domain/courses/application/next-course-catalog.service.ts`
- `src/domain/courses/infrastructure/db/next-courses.repository.ts`

Current behavior:

- `syncProgress()` upserts a lesson progress row.
- `getLesson()` reads all progress rows for the course and maps lesson completion into `LessonSummary.isCompleted`.
- The lesson sidebar shows completed count based on server-provided completed rows plus current local progress.

---

## 3. Gaps And Issues

### Critical Gaps

1. **No authoritative course completion table**
   - Lesson completion exists, but course completion is inferred.
   - Certificates need a stable aggregate, not repeated ad hoc counting.

2. **No certificate eligibility source of truth**
   - There is no server-side field like `eligible_for_certificate`, `completed_at`, or `certificate_issued_at`.
   - Any certificate feature would currently need to recalculate completion every time.

3. **Course completion is not transactionally updated**
   - `syncProgress()` writes one lesson row only.
   - It does not evaluate whether the course crossed the completion threshold in the same write flow.

4. **No idempotent completion event**
   - Replaying progress syncs can rewrite progress, but there is no stable course completion event.
   - Certificate generation needs idempotency to prevent duplicate certificate issuance.

5. **Lesson validation is incomplete at the persistence boundary**
   - The repository accepts `lessonId` and `courseId` together, but the write path should verify the lesson belongs to the course.
   - Without validation, a malformed client call could create inconsistent progress rows.

6. **`localStorage` is treated as progress source for resume UX**
   - This is acceptable for fast UX, but server DB must become the primary resume source for signed-in users.
   - Current server data is not hydrated back into the progress hook as the initial persisted state.

7. **No durable course progress percentage**
   - UI can count completed lessons, but profile/course dashboards cannot query one compact row for `completedLessons`, `totalLessons`, and `progressPercentage`.

8. **No certificate revocation/invalidation model**
   - If lessons are added after completion, or a course is unpublished/changed, certificate rules are undefined.

9. **No audit trail**
   - Certificate generation and course completion should be explainable: when completed, based on which lesson count, and by which rule version.

10. **No aggregate concurrency strategy**
    - Two tabs can complete different lessons at nearly the same time.
    - Without row locking or optimistic concurrency, the `course_progress` aggregate can be overwritten by stale counts.

11. **No concrete idempotency storage**
    - The proposed `clientEventId` is useful only if it is persisted and enforced with a unique constraint.
    - Network retries must return the original result instead of replaying side effects.

12. **Catch-all course API route is a scaling risk**
    - The current `src/app/api/courses/[[...path]]/route-handlers.ts` pattern is workable for a small surface area, but it becomes a private routing framework as the course API grows.
    - Progress and certificate endpoints should use resource-specific route files.

13. **`stale_after_curriculum_change` has no owner**
    - The status is useful, but the write path must be explicit.
    - Course admin publish actions, not frontend reads, should mark completed progress stale when required lessons are added.

14. **Observability is not yet actionable**
    - Logging requirements must name structured fields, metric names, and alert thresholds.
    - Completion and certificate flows should be traceable by request ID and idempotency key.

15. **No rate limit or offline retry plan**
    - A buggy client can write progress too frequently.
    - A learner on a poor connection can complete a lesson locally while the server never receives the completion event.

16. **Certificate issuance UI states are incomplete**
    - Eligibility and issued certificate are separate states.
    - Slow or failed certificate issuance needs loading, retry, and error handling.

17. **Course unpublish/delete behavior is a product dependency**
    - The write behavior for in-flight progress syncs against unpublished courses must be decided before public API release.
    - Phase 3 is blocked until product chooses whether unpublished-course progress writes are rejected, accepted for enrolled learners, or queued for review.

---

## 4. Completion Rules

### Lesson Completion Rule

A lesson is complete when one of the following server-accepted conditions is met:

- Video lesson: `watched_percentage >= 90`.
- Non-video lesson: learner explicitly marks it complete through a server endpoint.
- Admin override: privileged action marks lesson complete with an audit reason.

The first valid completion timestamp must be immutable:

- If `completed_at` already exists, do not replace it.
- If completion is removed by an admin override, store a separate audit event rather than silently deleting history.

### Course Completion Rule

A course is complete when:

- User has an active subscription/enrollment for the course.
- All required, active, non-archived lessons have `completed = true`.
- The required lesson count is greater than zero.

Enrollment dependency:

- The existing enrollment source is `courses.subscriptions`.
- Active enrollment is defined as `subscriptions.user_id = userId`, `subscriptions.course_id = courseId`, and `subscriptions.is_active = true`.
- `CourseProgressCommandService` must query this through an enrollment/subscription repository interface, not by importing Drizzle schema directly.
- If the enrollment model changes, the command service contract stays stable and only the repository implementation changes.

Optional future extension:

- Add `is_required` to lessons so optional lessons do not block certificates.

### Certificate Eligibility Rule

A learner is eligible for certificate generation when:

- Course completion state is `completed`.
- `completed_at` is present.
- Course has `certificate_enabled = true` or equivalent config.
- No active revocation exists for the learner/course.
- Certificate has not already been issued, or the existing certificate can be regenerated idempotently by certificate number.

---

## 5. Target Architecture

### Ownership Boundaries

| Layer | Responsibility |
|---|---|
| Client hook | Track playback state, provide optimistic UI, send progress sync events |
| Server Action / Route Handler | Auth, request validation, stable API contract |
| Course Progress Command Service | Lesson progress write, course aggregate recomputation, certificate eligibility transition |
| Course Progress Query Service | Read optimized progress snapshots for lesson, course detail, and profile surfaces |
| Repository | Transactional database reads/writes only |
| Certificate Service | Issue certificate from completed course state only |

### Architecture Diagram

```text
Lesson UI
  | local optimistic state + retry queue
  v
POST /api/courses/{courseId}/lessons/{lessonId}/progress
  | auth, validation, rate limit, idempotency
  v
CourseProgressCommandService
  | transaction
  |-- read course_progress.version
  |-- persist progress_sync_events(clientEventId)
  |-- upsert lesson_progress
  |-- recompute course_progress
  |-- update course_progress where version = expectedVersion
  |-- retry bounded optimistic conflicts
  v
Postgres
  | course_progress read model
  v
CourseProgressQueryService
  |-- lesson page hydration
  |-- course detail progress
  |-- profile course cards

Certificate CTA
  v
POST /api/courses/{courseId}/certificate
  | idempotent create
  v
CertificateService
  | verifies course_progress only
  v
certificates(certificate_number, metadata snapshot)
```

### SOLID Application

- **Single Responsibility**: Lesson progress tracking, course completion aggregation, and certificate issuance live in separate services.
- **Open/Closed**: Completion rules are encapsulated in a policy object so quizzes, assignments, or optional lessons can be added later without rewriting persistence.
- **Liskov Substitution**: Services depend on explicit TypeScript repository interfaces, allowing tests to use in-memory repositories without changing service behavior.
- **Interface Segregation**: Write services depend on command repositories; read surfaces depend on query repositories. Certificate generation depends on a `CourseCompletionReadModel`, not raw lesson rows.
- **Dependency Inversion**: Application services depend on domain-layer interfaces; Drizzle remains an infrastructure detail.

Layering rule:

- Domain contracts and application services must not import from `src/domain/courses/infrastructure/db`.
- Infrastructure repositories may import domain contracts and implement them.
- Route handlers may depend on service factories, not Drizzle repositories directly.

### Design Patterns To Use

The implementation should use the following patterns deliberately. These are not optional style choices; they are the maintainability boundaries for this feature.

| Pattern | Where To Apply | Why It Matters |
|---|---|---|
| Clean Architecture / Ports and Adapters | Domain contracts in `src/domain/courses/contracts`, Drizzle implementation in `infrastructure/db`, route handlers as inbound adapters | Keeps business rules independent from Next.js and Drizzle |
| CQRS | `CourseProgressCommandService` for writes, `CourseProgressQueryService` for reads | Prevents profile/course-card reads from depending on transactional write logic |
| Repository | `ICourseProgressCommandRepository`, `ICourseProgressQueryRepository`, `ICertificateRepository`, enrollment repository | Centralizes persistence, keeps SQL out of application services |
| Unit of Work | `withProgressTransaction()` | Makes idempotency event creation, lesson upsert, and aggregate update atomic |
| Application Service | Progress command/query services and certificate service | Coordinates policies, repositories, transactions, and observability without leaking UI/API concerns |
| Policy / Strategy | `LessonCompletionPolicy`, `CourseCompletionPolicy`, certificate eligibility policy | Allows future completion rules such as quizzes, assignments, optional lessons, or admin overrides |
| Specification | `ActiveEnrollmentSpecification`, `CertificateEligibilitySpecification`, `CourseWritableSpecification` | Makes preflight validation composable and testable before the write transaction opens |
| State Machine | Course progress status, certificate issuance UI status, offline queue item status | Prevents invalid transitions and makes edge cases explicit |
| Idempotent Command | Progress sync by `clientEventId`, certificate creation by `(userId, courseId)` | Makes retries safe across flaky networks and double-clicks |
| Optimistic Concurrency | `course_progress.version` and bounded retries | Handles two-tab progress updates without long DB locks |
| Factory / Dependency Injection | `createNextCourseDomain()` or a new progress domain factory | Wires repositories/services at the boundary and keeps tests simple |
| Mapper / Anti-Corruption Layer | DB rows to `CourseProgressSnapshot`, API response DTOs, certificate metadata snapshot | Prevents schema shape from leaking into UI or domain logic |
| Adapter | Rate limiter, OpenTelemetry tracer, IndexedDB retry queue, certificate number generator | Keeps infrastructure/vendor choices replaceable |
| Retry Queue | Frontend IndexedDB queue for unsynced progress events | Preserves learner progress in poor connectivity without trusting client state for certificates |
| Domain Event | `CourseCompleted`, `CertificateIssued`, `ProgressSyncFailed` | Gives observability and future integrations a stable event vocabulary |

Pattern boundaries:

- Do not put SQL in route handlers or React components.
- Do not put request/response DTOs inside domain services.
- Do not let `CourseProgressCommandService` import React, Next.js route types, or Drizzle table definitions.
- Do not let the frontend calculate certificate eligibility. It can render server state and local optimistic progress only.
- Do not add a generic event bus in Phase 1. Domain events can be simple typed records emitted to logs/metrics first; introduce an outbox only when async integrations need it.

Recommended domain event shapes:

```ts
type CourseCompletedEvent = {
  type: "CourseCompleted";
  userId: string;
  courseId: string;
  courseProgressId: string;
  completedAt: string;
  completedByBackfill: boolean;
  ruleVersion: string;
};

type CertificateIssuedEvent = {
  type: "CertificateIssued";
  userId: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: string;
  completionSource: "normal" | "backfill_approximate" | "admin_override";
};
```

---

## 6. Database Plan

### Keep Existing Table

Keep `courses.lesson_progress` as the source of lesson-level progress.

Recommended improvements:

- Add a required foreign key from `lesson_progress.lesson_id` to `courses.lessons.id`.
- Add check constraints:
  - `watched_percentage between 0 and 100`
  - `last_position >= 0`
- Add index:
  - `(user_id, course_id, completed)`
- Add nullable `last_client_event_id` for diagnostics only.
- Do not use `lesson_progress.last_client_event_id` for idempotency; use `progress_sync_events`.

### Add `progress_sync_events`

New table: `courses.progress_sync_events`

This table stores idempotency keys for progress sync requests. It prevents duplicate side effects when the browser retries, the network times out after a successful write, or the user has multiple tabs open.

Suggested columns:

```sql
id uuid primary key default gen_random_uuid(),
client_event_id uuid not null,
user_id text not null references auth.user(id) on delete cascade,
course_id uuid not null references courses.courses(id) on delete cascade,
lesson_id uuid not null,
event_type varchar(32) not null,
request_hash varchar(128) not null,
response_snapshot jsonb,
created_at timestamp not null default now(),
unique (user_id, client_event_id)
```

Idempotency scope:

- `clientEventId` deduplicates one HTTP request intent, not the lesson completion state.
- A single lesson can and should have many distinct progress events over time: heartbeat at 40%, heartbeat at 70%, completion at 91%.
- Each new user action or heartbeat gets a new `clientEventId`.
- A retry of the same HTTP request must reuse the same `clientEventId`.
- The unique constraint is `(user_id, client_event_id)` because the event ID is globally unique within a user's progress stream.
- If the same event ID is replayed with the same request hash, return the stored response snapshot.
- If the same event ID is replayed with a different request hash, return `409 Conflict`.

Retention:

- Keep events for 30 days.
- Delete old rows with a scheduled cleanup job.
- If the same `client_event_id` arrives with a different `request_hash`, return `409 Conflict`.

### Add `course_progress`

New table: `courses.course_progress`

Suggested columns:

```sql
id uuid primary key default gen_random_uuid(),
user_id text not null references auth.user(id) on delete cascade,
course_id uuid not null references courses.courses(id) on delete cascade,
status varchar(32) not null default 'not_started',
completed_lessons integer not null default 0,
required_lessons integer not null default 0,
progress_percentage integer not null default 0,
completed_at timestamp,
certificate_eligible_at timestamp,
last_lesson_id uuid,
last_position integer not null default 0,
version integer not null default 0,
curriculum_version integer not null default 1,
rule_version varchar(32) not null default 'v1',
completed_by_backfill boolean not null default false,
created_at timestamp not null default now(),
updated_at timestamp not null default now(),
unique (user_id, course_id)
```

Allowed statuses:

- `not_started`
- `in_progress`
- `completed`
- `stale_after_curriculum_change`
- `revoked`

Concurrency requirement:

- Use optimistic concurrency with the `version` column.
- Do not use `SELECT ... FOR UPDATE` for the normal progress sync path.
- The command service reads the current aggregate version, computes the next aggregate, and updates with `WHERE user_id = ? AND course_id = ? AND version = ?`.
- If zero rows are updated, another request won the race. Re-read lesson progress and course progress, recompute, and retry.
- Retry budget: maximum 3 attempts per request.
- Backoff: 25ms, 75ms, 150ms plus small jitter.
- If all retries fail, return `409 CONCURRENT_PROGRESS_UPDATE` with `Retry-After: 1`; the client keeps the event queued and retries.
- Increment `version` on every successful aggregate write.
- The transition to `completed` must be idempotent: only the first successful writer sets `completed_at` and `certificate_eligible_at`; later retries observe the completed aggregate and return it.

Required index:

```sql
create unique index course_progress_user_course_uq
  on courses.course_progress (user_id, course_id);

create index course_progress_completed_user_course_idx
  on courses.course_progress (user_id, course_id)
  where status = 'completed';
```

Curriculum change requirement:

- Add or reuse a course-level `curriculum_version` value that increments when required active lessons are added, removed, archived, or made optional/required.
- Copy the current value into `course_progress.curriculum_version` after each recomputation.
- A completed course whose stored `curriculum_version` is behind the course version becomes stale only through the admin publish/write path, not through frontend reads.

### Add `certificates`

New table: `courses.certificates`

Suggested columns:

```sql
id uuid primary key default gen_random_uuid(),
certificate_number varchar(64) not null unique,
user_id text not null references auth.user(id) on delete cascade,
course_id uuid not null references courses.courses(id) on delete cascade,
course_progress_id uuid not null references courses.course_progress(id),
issued_at timestamp not null default now(),
revoked_at timestamp,
revocation_reason text,
metadata jsonb,
created_at timestamp not null default now(),
updated_at timestamp not null default now(),
unique (user_id, course_id)
```

`metadata` should snapshot certificate-critical details:

- learner display name
- course title
- completion date
- completion source: `normal`, `backfill_approximate`, or `admin_override`
- rule version
- required lesson count
- certificate template version

This keeps issued certificates stable even if the course title changes later.

Backfilled completions:

- If `course_progress.completed_by_backfill = true`, certificate metadata must set `completion_source = "backfill_approximate"`.
- The certificate UI can display the completion date normally, but support/admin tooling must expose the source so support can explain approximate dates.

### Certificate Number Generation

Use a short, URL-safe certificate number instead of a raw UUID. Certificate numbers are opaque public IDs verified by database lookup only; they are not cryptographic proof of completion.

Recommended algorithm:

1. Build payload: `userId + ":" + courseId + ":" + issuedAtIso + ":" + randomNonce`.
2. Generate HMAC-SHA256 with a server-only `CERTIFICATE_SIGNING_SECRET`.
3. Base62 encode the digest.
4. Store the first 10 to 14 characters with a `SX-` prefix, for example `SX-8F3K2Q9LMP`.
5. Enforce uniqueness in the database and retry generation on rare collision.

Threat model:

- The HMAC is used as a collision-resistant ID generator with unpredictable output.
- Verification is DB-first: `certificates.certificate_number` must exist, must not be revoked, and must match the stored metadata.
- Secret rotation does not invalidate existing certificates because the full issued number is stored in the database.
- If `CERTIFICATE_SIGNING_SECRET` rotates, new certificate numbers use the new secret. Existing certificates remain verifiable by lookup.
- This design does not make certificate numbers tamper-evident. If tamper-evident offline verification becomes a requirement, add a separate signed certificate payload with `key_id`, canonical metadata, signature, and public-key verification.

---

## 7. Application Service Plan

### Add Command And Query Services

Write-side service:

```ts
interface CourseProgressCommandService {
  syncLessonProgress(command: SyncLessonProgressCommand): Promise<CourseProgressResult>;
  recalculateAfterCurriculumChange(command: CurriculumChangedCommand): Promise<void>;
}
```

`syncLessonProgress()` must:

1. Authenticate user before service call.
2. Validate lesson belongs to course before opening a write transaction.
3. Validate active subscription before opening a write transaction.
4. Clamp progress values.
5. Open the write transaction only after read-only validations pass.
6. Persist and enforce `clientEventId` idempotency.
7. Upsert lesson progress.
8. Recalculate course aggregate in the same transaction.
9. Transition course to `completed` once, preserving first `completed_at`.
10. Return the updated course progress snapshot.

Transaction boundary:

- Auth, lesson/course ownership validation, active subscription validation, and course publish-state validation are read-only preflight checks.
- The write transaction starts after these checks pass.
- The transaction contains idempotency event creation, lesson progress upsert, aggregate recompute, and optimistic aggregate update.
- If preflight fails, reject without opening a write transaction.

Read-side service:

```ts
interface CourseProgressQueryService {
  getCourseProgress(userId: string, courseId: string): Promise<CourseProgressSnapshot>;
  getLessonProgress(userId: string, courseId: string): Promise<LessonProgressSnapshot[]>;
  listCourseProgressForProfile(userId: string): Promise<CourseProgressSummary[]>;
}
```

Separating commands from queries avoids forcing profile/course-card reads through the same dependency surface as transactional progress writes.

### Add Completion Policy

Create a policy module:

```ts
interface LessonCompletionPolicy {
  isLessonComplete(input: LessonProgressInput): boolean;
}

interface CourseCompletionPolicy {
  evaluate(input: {
    requiredLessonCount: number;
    completedLessonCount: number;
    hasActiveSubscription: boolean;
  }): CourseCompletionDecision;
}
```

This keeps completion rules testable and separate from Drizzle queries.

### Repository Additions

Add repository methods:

```ts
interface ICourseProgressCommandRepository {
  withProgressTransaction<T>(fn: (tx: CourseProgressTx) => Promise<T>): Promise<T>;
  findLessonInCourse(tx, courseId, lessonId): Promise<CourseLessonRecord | null>;
  findActiveSubscription(tx, userId, courseId): Promise<SubscriptionRecord | null>;
  findOrInitializeCourseProgress(tx, userId, courseId): Promise<CourseProgressRecord>;
  findProgressEvent(tx, userId, clientEventId): Promise<ProgressSyncEventRecord | null>;
  createProgressEvent(tx, event): Promise<void>;
  upsertLessonProgress(tx, command): Promise<LessonProgressRecord>;
  updateCourseProgressWithVersion(tx, command): Promise<CourseProgressRecord | null>;
}

interface ICourseProgressQueryRepository {
  getCourseProgress(userId, courseId): Promise<CourseProgressSnapshot | null>;
  getLessonProgress(userId, courseId): Promise<LessonProgressSnapshot[]>;
  listCourseProgressForProfile(userId): Promise<CourseProgressSummary[]>;
}

interface ICertificateRepository {
  findCertificateByUserCourse(userId, courseId): Promise<CertificateRecord | null>;
  findCertificateByNumber(certificateNumber): Promise<CertificateRecord | null>;
  createCertificate(command): Promise<CertificateRecord>;
}
```

`findOrInitializeCourseProgress()` is not a lock-acquiring read. It creates the row if absent and returns the current aggregate/version for optimistic concurrency.

Use a transaction for idempotency event creation, lesson progress upsert, and course progress recompute.

### Course Publish-State Policy

This is a Phase 3 blocker and requires product sign-off before public progress APIs ship.

Default engineering recommendation:

- If a course is unpublished or archived, reject new progress writes with `409 COURSE_NOT_ACTIVE`.
- Preserve existing `lesson_progress`, `course_progress`, and `certificates` rows.
- Allow read access to existing progress for already-enrolled learners only if product wants a grace period.
- Never delete progress rows as part of unpublishing.

Open product decision:

- Whether learners already enrolled before unpublish can continue completing lessons during a grace period.
- Whether certificate eligibility can still be reached during that grace period.
- What UI copy appears when a learner is mid-session and the course becomes unavailable.

### Curriculum Staleness Owner

Required lesson changes are admin-owned writes. The admin course publish/update service must:

1. Increment `courses.curriculum_version` whenever required lesson membership changes.
2. Find completed `course_progress` rows for the course.
3. If no certificate has been issued, set status to `stale_after_curriculum_change`.
4. If a certificate already exists, keep the certificate valid and leave a curriculum-change audit event.

Do not let page reads mutate completion state.

---

## 8. API And Server Boundary Plan

### Replace Server Action As Primary API

Current `syncLessonProgress()` Server Action can remain as a thin compatibility wrapper, but the production API should be a resource-specific route handler:

`POST /api/courses/:courseId/lessons/:lessonId/progress`

Request:

```json
{
  "eventType": "completion",
  "watchedPercentage": 91,
  "lastPosition": 420,
  "completed": true,
  "completedAt": "2026-05-19T10:00:00.000Z",
  "clientEventId": "uuid"
}
```

Response:

```json
{
  "lesson": {
    "id": "uuid",
    "completed": true,
    "completedAt": "2026-05-19T10:00:00.000Z",
    "watchedPercentage": 91,
    "lastPosition": 420
  },
  "course": {
    "id": "uuid",
    "status": "in_progress",
    "completedLessons": 4,
    "requiredLessons": 10,
    "progressPercentage": 40,
    "completedAt": null,
    "certificateEligibleAt": null
  }
}
```

Route file:

```text
src/app/api/courses/[courseId]/lessons/[lessonId]/progress/route.ts
```

Do not add new progress/certificate behavior to the existing catch-all route. Keep the catch-all only as a backward-compatible facade for existing catalog/enrollment endpoints until it can be retired.

### Rate Limiting

Progress sync is a write-heavy endpoint and must be rate-limited.

Event types:

- `heartbeat`: periodic playback progress.
- `pause`: user paused playback.
- `seek`: user moved playback position.
- `completion`: video crossed the server completion threshold or ended.
- `manual_complete`: non-video lesson was explicitly marked complete.

Initial limits by event type:

- `heartbeat`: 1 accepted sync per user + lesson every 15 seconds.
- `pause` and `seek`: 1 accepted sync per user + lesson every 5 seconds.
- `completion` and `manual_complete`: no time-based per-lesson throttle.
- All event types require idempotency through `clientEventId`.
- Completion events are accepted immediately unless the exact same `clientEventId` was already processed.

Abuse protection:

- Apply edge/global abuse limits separately from business rate limits.
- Do not reject valid completion events because of heartbeat throttling.

Response behavior:

- Return `429` with `Retry-After`.
- Client keeps the latest unsynced event and retries with exponential backoff.

### Certificate Endpoints

Recommended endpoints:

- `GET /api/courses/:courseId/progress`
- `GET /api/courses/:courseId/certificate/eligibility`
- `POST /api/courses/:courseId/certificate`
- `GET /certificates/:certificateNumber`

Route files:

```text
src/app/api/courses/[courseId]/progress/route.ts
src/app/api/courses/[courseId]/certificate/eligibility/route.ts
src/app/api/courses/[courseId]/certificate/route.ts
src/app/(platform)/certificates/[certificateNumber]/page.tsx
```

`POST /certificate` must be idempotent:

- If certificate already exists, return it.
- If not eligible, return `409 Conflict`.
- If eligible, create certificate inside a transaction.

---

## 9. Frontend Plan

### Lesson Viewer

Update `LessonClientBridge` and `useLessonProgress` behavior:

1. Hydrate initial progress from server for signed-in users.
2. Keep `localStorage` only as a fast fallback/cache.
3. Debounce periodic syncs, but immediately sync on completion.
4. Use returned course progress to update sidebar and completion CTA.
5. Show certificate CTA only when server says `certificateEligibleAt` exists.

### Offline And Poor Connectivity

The client must keep a small retry queue in IndexedDB.

Storage fallback policy:

- Primary: IndexedDB.
- Fallback: `localStorage` with only the latest pending event per `(courseId, lessonId)` if IndexedDB is unavailable.
- If neither IndexedDB nor `localStorage` is available, keep an in-memory queue for the active session and show "Progress may not be saved if you close this tab."
- On quota errors, evict acknowledged heartbeat events first, then old unacknowledged heartbeat events, but never drop unacknowledged completion events without surfacing failure UI.

Queue behavior:

- Store the latest pending progress event per `(courseId, lessonId)`.
- Include a stable `clientEventId` for each event.
- Preserve the same `clientEventId` across retries of the same event.
- Use a new `clientEventId` when the user produces a new event.
- Retry with exponential backoff: 2s, 5s, 15s, 30s, then every 60s.
- Flush immediately on `online`, `visibilitychange`, and `pagehide`.
- Use `navigator.sendBeacon` for best-effort page unload sync when available.
- Treat `sendBeacon` as best effort only; mobile browsers may skip `pagehide`.
- The true reliability guarantee is queue replay on the next session open.
- If completion cannot be confirmed by the server, show local optimistic completion but do not show certificate eligibility.

Failure UI:

- Show a non-blocking "Progress syncing" state when events are queued.
- Show "Progress saved on this device" if retries continue failing.
- Replace optimistic state with server state after successful sync.

### Course Detail Page

Render course progress from `course_progress` for enrolled users:

- Progress percentage.
- Completed lesson count.
- Continue lesson link.
- Certificate CTA when eligible.

### Certificate Issuance UI States

Certificate eligibility and certificate issuance are separate states. The frontend must model them explicitly:

| State | Server state | UI behavior |
|---|---|---|
| `not_eligible` | `certificateEligibleAt = null` | Hide certificate CTA or show disabled progress message |
| `eligible_not_issued` | Eligible and no certificate row exists | Show "Generate certificate" CTA |
| `issuing` | POST `/certificate` in flight | Disable CTA and show loading state |
| `issued` | Certificate row returned or already exists | Redirect/open `/certificates/:certificateNumber` |
| `issue_failed_retryable` | Network error, 5xx, or `409 CONCURRENT_PROGRESS_UPDATE` | Show retry action; keep eligibility visible |
| `issue_failed_blocked` | 401, 403, revoked, course not active, or no longer eligible | Hide CTA and show server-provided explanation |

Click behavior:

1. User clicks "Generate certificate".
2. UI enters `issuing`.
3. On success, route to the certificate page returned by the API.
4. On retryable failure, show "Could not generate certificate. Try again."
5. On blocked failure, refetch eligibility and render the returned state.

The CTA must be idempotent-safe: double-clicking should not create duplicate certificate requests, and API idempotency still returns the existing certificate if one was created by a prior request.

### Profile / My Courses

Use the course progress aggregate instead of scanning lesson rows per card:

- `not_started`: "Start course"
- `in_progress`: "Continue"
- `completed`: "View certificate"
- `stale_after_curriculum_change`: "Complete new lessons"

---

## 10. Certificate Generation Flow

```text
Learner completes lesson
  -> POST progress
  -> request passes rate limit and idempotency check
  -> Progress service writes lesson_progress
  -> Progress service recalculates course_progress
  -> Course transitions to completed
  -> certificate_eligible_at is set
  -> UI shows certificate CTA
  -> Learner requests certificate
  -> Certificate service verifies course_progress
  -> Certificate row is created idempotently
  -> Certificate page/PDF renders from certificate snapshot metadata
```

Important rule:

Certificate generation must never trust client-provided completion data directly. It must read `course_progress` and `lesson_progress` from the database.

---

## 11. Migration Strategy

### Phase 1 - Schema

1. Add `course_progress`.
2. Add `progress_sync_events`.
3. Add `certificates`.
4. Add `version` and `curriculum_version` support.
5. Add course-level required lesson count metadata.
6. Add constraints/indexes to `lesson_progress`.
7. Backfill `course_progress` from existing `lesson_progress`.

Backfill requirements:

- Write the backfill SQL before merging the migration.
- Run a dry-run against a production replica.
- Record counts before and after: users, courses, lesson progress rows, completed lesson rows, generated course progress rows, completed course progress rows.
- Mark generated rows with `completed_by_backfill = true`.
- Do not issue certificates from backfilled completion automatically; require an explicit certificate request or admin-reviewed batch.
- Store the backfill run ID in logs so suspicious completions can be audited.
- Add a pre-check that counts existing `course_progress` rows before inserting.
- Keep `on conflict (user_id, course_id) do nothing` intentionally so reruns preserve existing rows silently.
- Add a migration comment explaining that conflict behavior is intentional idempotency, not data loss.

Backfill query shape:

```sql
with required_lessons as (
  select
    l.course_id,
    count(*)::int as required_lessons
  from courses.lessons l
  where l.status = 'active'
    and l.is_archived = false
  group by l.course_id
),
valid_progress as (
  select distinct on (lp.user_id, lp.course_id, lp.lesson_id)
    lp.user_id,
    lp.course_id,
    lp.lesson_id,
    lp.completed,
    lp.completed_at,
    lp.watched_percentage,
    lp.last_position,
    lp.updated_at
  from courses.lesson_progress lp
  join courses.lessons l
    on l.id = lp.lesson_id
   and l.course_id = lp.course_id
  where l.status = 'active'
    and l.is_archived = false
  order by
    lp.user_id,
    lp.course_id,
    lp.lesson_id,
    lp.completed desc,
    lp.updated_at desc
),
aggregate_progress as (
  select
    vp.user_id,
    vp.course_id,
    count(*) filter (where vp.completed = true)::int as completed_lessons,
    max(vp.updated_at) as last_progress_at,
    (array_agg(vp.lesson_id order by vp.updated_at desc))[1] as last_lesson_id,
    (array_agg(vp.last_position order by vp.updated_at desc))[1] as last_position
  from valid_progress vp
  group by vp.user_id, vp.course_id
)
insert into courses.course_progress (
  user_id,
  course_id,
  status,
  completed_lessons,
  required_lessons,
  progress_percentage,
  completed_at,
  certificate_eligible_at,
  last_lesson_id,
  last_position,
  completed_by_backfill,
  created_at,
  updated_at
)
select
  ap.user_id,
  ap.course_id,
  case
    when rl.required_lessons > 0
     and ap.completed_lessons >= rl.required_lessons
    then 'completed'
    when ap.completed_lessons > 0 then 'in_progress'
    else 'not_started'
  end as status,
  ap.completed_lessons,
  coalesce(rl.required_lessons, 0),
  case
    when coalesce(rl.required_lessons, 0) = 0 then 0
    else least(100, floor((ap.completed_lessons::numeric / rl.required_lessons) * 100)::int)
  end as progress_percentage,
  case
    when rl.required_lessons > 0
     and ap.completed_lessons >= rl.required_lessons
    then ap.last_progress_at
    else null
  end as completed_at,
  case
    when rl.required_lessons > 0
     and ap.completed_lessons >= rl.required_lessons
    then ap.last_progress_at
    else null
  end as certificate_eligible_at,
  ap.last_lesson_id,
  coalesce(ap.last_position, 0),
  true,
  now(),
  now()
from aggregate_progress ap
left join required_lessons rl on rl.course_id = ap.course_id
where coalesce(rl.required_lessons, 0) > 0
-- Intentional idempotency: preserve existing course_progress rows if the
-- backfill is rerun or if live progress created the aggregate first.
on conflict (user_id, course_id) do nothing;
```

Dirty-data handling:

- Duplicate progress rows are collapsed by `(user_id, course_id, lesson_id)`, preferring completed rows and then latest `updated_at`.
- Progress rows whose lessons no longer exist are ignored and counted in the dry-run report.
- Courses with no active lessons are not backfilled as completed.
- Existing `course_progress` rows are not overwritten by the initial backfill.

### Phase 2 - Domain Layer

1. Add completion policy.
2. Add course progress command service.
3. Add course progress query service.
4. Add certificate service.
5. Add repository interfaces in the domain contracts layer.
6. Move progress sync logic out of catalog service.
7. Keep existing Server Action as a wrapper to avoid frontend breakage.

### Phase 3 - API

1. Add resource-specific progress route handler.
2. Add course progress read endpoint.
3. Add certificate eligibility endpoint.
4. Add idempotent certificate creation endpoint.
5. Add endpoint-level rate limiting.
6. Block public release until course unpublish/delete behavior has product sign-off.

### Phase 4 - Frontend

1. Hydrate lesson progress from server.
2. Replace sidebar completion calculation with server aggregate plus optimistic current lesson overlay.
3. Add offline retry queue.
4. Add course detail progress UI.
5. Add certificate CTA with `eligible_not_issued`, `issuing`, `issued`, and failed states.

### Phase 5 - Certificate Rendering

1. Add certificate detail page.
2. Add PDF/export path if required.
3. Add verification page by certificate number.
4. Include `completion_source` in certificate metadata and admin/support views.

---

## 12. Performance Plan

### Write Path

- Upsert one lesson row.
- Read required lesson count from cached course/curriculum metadata when available.
- Count completed lesson rows by `(user_id, course_id, completed)`.
- Upsert one course aggregate row.

Expected complexity:

- O(1) write plus one indexed completed-count query in the common case.
- Suitable for real-time lesson completion.

Required lesson count:

- Store required active lesson count on the course row or a course curriculum metadata row.
- Recompute it only in the admin lesson publish/update path.
- Fall back to counting active required lessons during backfill and repair jobs.

### Read Path

- Course cards and profile pages read `course_progress`.
- Lesson page reads lesson list plus progress rows for one course.
- Certificate page reads one certificate row by unique certificate number.

Avoid:

- Recalculating all course completion state for every profile card render.
- Trusting frontend completion state for certificate decisions.
- Running certificate eligibility by scanning lessons on every request when `course_progress` already exists.

---

## 13. Reliability And Edge Cases

| Scenario | Expected Behavior |
|---|---|
| User watches 91% twice | Completion remains idempotent; original `completed_at` preserved |
| User refreshes before sync | `localStorage` fallback restores UX; next sync persists to DB |
| User completes final lesson | Course aggregate transitions to `completed` in same transaction |
| Two tabs complete lessons simultaneously | Optimistic version conflict retries; final aggregate includes both lesson rows |
| Optimistic retry budget is exhausted | Return `409 CONCURRENT_PROGRESS_UPDATE`; client keeps event queued and retries |
| Network retries same event | `progress_sync_events` returns stored response for same `client_event_id` |
| Same idempotency key with different payload | Return `409 Conflict` |
| Course has zero active lessons | Course cannot be completed automatically |
| Lesson is archived after completion | Course progress can remain completed, or become stale based on product policy |
| New required lesson is added | Admin publish path increments `curriculum_version` and marks unissued completed progress stale |
| Course is unpublished mid-session | Phase 3 behavior requires product sign-off; default recommendation is `409 COURSE_NOT_ACTIVE` and preserve existing progress |
| Certificate already exists | Return existing certificate; do not create duplicate |
| Enrollment inactive | Progress may be readable, but new completion/certificate actions are blocked |
| Malformed lesson/course pair | Reject with `400` or `404`; do not create progress row |
| Client is offline | Queue latest progress event locally and retry; certificate CTA waits for server confirmation |
| Certificate issuance fails after eligibility | UI stays eligible, exits loading state, and shows retry unless server returns a blocked state |

---

## 14. Testing Plan

### Unit Tests

- Lesson completion policy.
- Course completion policy.
- Progress percentage calculation.
- Idempotent completion timestamp behavior.
- Idempotency key replay and conflict behavior.
- Concurrent final-lesson completion behavior.
- Optimistic concurrency retry budget and exhausted-retry behavior.
- Certificate eligibility decisions.

### Repository Tests

- Lesson progress upsert.
- Course progress aggregate update.
- Duplicate certificate prevention.
- Optimistic version increment behavior.
- Lesson/course ownership validation.
- Curriculum version stale transition.
- Concurrent final-lesson completion with two transactions in flight; verify exactly one `completed` transition and one `completed_at`.

### Route Tests

- Unauthorized progress sync returns `401`.
- Non-enrolled user cannot sync progress.
- Completion response includes updated course aggregate.
- Certificate create returns `409` before eligibility.
- Certificate create returns existing certificate when called twice.
- Certificate create failure maps to retryable or blocked UI state.
- Progress sync returns `429` when rate limit is exceeded.
- Unpublished-course progress sync behavior matches the product decision before Phase 3 release.

### E2E Tests

1. Enroll in course.
2. Watch lesson past 90%.
3. Refresh lesson page and verify completion remains.
4. Complete one lesson offline and verify queued retry syncs when online.
5. Complete all required lessons.
6. Verify course detail shows completed state.
7. Generate certificate and verify loading state redirects to certificate page.
8. Simulate retryable certificate failure and verify retry UI.
9. Open certificate verification URL.

---

## 15. Implementation Checklist

### Database

- [ ] Add `course_progress` table.
- [ ] Add `progress_sync_events` table.
- [ ] Add `certificates` table.
- [ ] Add `version` and `curriculum_version` to course progress design.
- [ ] Add `completed_by_backfill` to course progress.
- [ ] Add or reuse course-level `curriculum_version` and required lesson count metadata.
- [ ] Add required FK from `lesson_progress.lesson_id` to `courses.lessons.id`.
- [ ] Add lesson progress constraints.
- [ ] Add required indexes.
- [ ] Add partial completed index on `course_progress(user_id, course_id)`.
- [ ] Backfill existing course progress after production-replica dry-run.

### Domain

- [ ] Add `CourseProgressCommandService`.
- [ ] Add `CourseProgressQueryService`.
- [ ] Add completion policy module.
- [ ] Add specification objects for active enrollment, certificate eligibility, and course writeability.
- [ ] Add certificate service.
- [ ] Add typed domain events for course completion, certificate issuance, and progress sync failure.
- [ ] Add domain repository interfaces.
- [ ] Add enrollment/subscription repository interface backed by `courses.subscriptions`.
- [ ] Add mappers from DB rows to domain snapshots and API DTOs.
- [ ] Keep lesson/course ownership and active subscription checks outside the write transaction.
- [ ] Add repository transaction for progress sync.
- [ ] Move progress sync out of catalog service.
- [ ] Get product sign-off for unpublished/deleted course progress behavior before Phase 3.
- [ ] Add curriculum staleness handling to admin publish/update flow.

### Patterns

- [ ] Enforce ports-and-adapters: domain contracts contain interfaces; infrastructure implements them.
- [ ] Enforce CQRS: write routes call command service; read routes/pages call query service.
- [ ] Enforce Unit of Work: progress write path uses one transaction boundary.
- [ ] Enforce state machines for course progress and certificate issuance UI.
- [ ] Keep idempotent command handling centralized in the command service.
- [ ] Keep optimistic concurrency retry logic centralized and unit-tested.
- [ ] Wire services through a factory/DI boundary, not direct repository construction in route handlers.

### API

- [ ] Add progress sync route.
- [ ] Add progress read route.
- [ ] Add certificate eligibility route.
- [ ] Add certificate creation route.
- [ ] Add event-type-aware endpoint rate limiting.
- [ ] Use resource-specific route files for new progress and certificate routes.
- [ ] Implement unpublished-course behavior according to product decision before public release.
- [ ] Keep Server Action wrapper temporarily.

### Frontend

- [ ] Hydrate progress from server.
- [ ] Keep local optimistic progress.
- [ ] Add IndexedDB offline retry queue with stable `clientEventId`.
- [ ] Add degraded fallback behavior for `localStorage`, memory-only mode, and quota failures.
- [ ] Render course aggregate in sidebar/course detail/profile.
- [ ] Add certificate CTA from server eligibility only.
- [ ] Add certificate issuance loading, success redirect, retryable failure, and blocked failure states.
- [ ] Handle stale course completion state.

### Observability

- [ ] Emit structured logs for progress sync with `requestId`, `clientEventId`, `userId`, `courseId`, `lessonId`, `status`, `errorCode`, and `durationMs`.
- [ ] Emit metrics: `course.progress_sync.count`, `course.progress_sync.error_count`, `course.completion.count`, `course.completion.duration_ms`, `certificate.issued.count`, `certificate.issue.error_count`.
- [ ] Create OpenTelemetry spans in `CourseProgressCommandService`: `progress.idempotency_check`, `progress.lesson_upsert`, `progress.aggregate_recompute`, `progress.aggregate_update`, and `progress.completion_transition`.
- [ ] Attach span attributes: `user.id`, `course.id`, `lesson.id`, `client_event_id`, `event_type`, `attempt`, `version.expected`, `version.actual`, and `completion_transitioned`.
- [ ] Propagate `requestId` through logs, metrics, and traces.
- [ ] Alert when progress sync error rate exceeds 10% over 1 minute.
- [ ] Alert when progress sync error rate exceeds 2% over 10 minutes.
- [ ] Alert when certificate issue error rate exceeds 10% over 1 minute.
- [ ] Alert when certificate issue error rate exceeds 1% over 10 minutes.
- [ ] Add dashboard panels for sync latency p95/p99, completion count, certificate issuance count, and idempotency conflicts.

---

## 16. Recommended File Map

```text
drizzle/
  000X_course_progress_and_certificates.sql

src/domain/courses/contracts/
  course-progress.repository.ts
  certificate.repository.ts
  enrollment.repository.ts
  course-progress.types.ts
  course-progress.events.ts

src/domain/courses/application/
  course-completion.policy.ts
  course-completion.specifications.ts
  course-progress-command.service.ts
  course-progress-query.service.ts
  certificate.service.ts
  certificate-eligibility.policy.ts
  course-progress.mapper.ts

src/domain/courses/infrastructure/db/
  next-courses.repository.ts
  next-course-progress.repository.ts
  next-certificate.repository.ts
  next-enrollment.repository.ts

src/domain/courses/factory/
  course-progress-domain.factory.ts

src/app/api/courses/[courseId]/lessons/[lessonId]/progress/
  route.ts

src/app/api/courses/[courseId]/progress/
  route.ts

src/app/api/courses/[courseId]/certificate/eligibility/
  route.ts

src/app/api/courses/[courseId]/certificate/
  route.ts

src/actions/
  course.actions.ts

src/hooks/
  use-lesson-progress.ts

src/app/(platform)/courses/[slug]/
  page.tsx
  _components/course-curriculum.tsx

src/app/(platform)/courses/[slug]/lessons/[lessonId]/
  page.tsx
  _components/lesson-client-bridge.tsx
  _components/lesson-sidebar.tsx

src/app/(platform)/certificates/
  [certificateNumber]/page.tsx
```

---

## 17. Definition Of Done

The feature is production-ready when:

- Lesson completion survives refresh, device change, and browser change.
- Course completion is stored in `courses.course_progress`.
- Certificate eligibility is derived only from server-side state.
- Certificate issuance is idempotent.
- Progress sync is idempotent by persisted `clientEventId`.
- Concurrent lesson completion cannot lose aggregate updates.
- Optimistic concurrency retry behavior is implemented and tested.
- New progress and certificate endpoints are resource-specific route files.
- Progress writes are rate-limited.
- Offline completion is queued and retried without showing certificate eligibility until server confirmation.
- Existing lesson progress rows are backfilled into course progress with `completed_by_backfill = true` and audited dry-run counts.
- Certificate issuance has explicit pending, success, retryable failure, and blocked failure UI states.
- Active enrollment validation is backed by `courses.subscriptions` through a domain interface.
- Public progress APIs do not ship until unpublished/deleted course behavior has product sign-off.
- Design pattern boundaries are enforced: CQRS split, repositories as ports, Unit of Work transaction, policies/specifications, mappers, and factory wiring.
- Tests cover policy, repository, API, and the core learner journey.
- The UI never shows a certificate CTA unless the server says the learner is eligible.
