# Feature Specification: Course Completion State

**Feature Branch**: `007-course-completion-state`  
**Created**: 2026-05-20  
**Status**: Draft approved for Phase 1 schema work  
**Plan**: [plan.md](./plan.md)

---

## Summary

Persist learner lesson progress and derive authoritative course completion state in the database so ScholarX can reliably power course progress UI, resume behavior, and certificate generation.

The feature introduces a server-authoritative completion model:

1. Lesson progress remains the granular source of learner activity.
2. Course progress becomes a persisted aggregate per learner/course.
3. Certificates are issued idempotently from server-confirmed course completion only.
4. Client-side state remains optimistic UX only and never determines certificate eligibility.

---

## Problem Statement

The current course system stores lesson-level progress but does not persist course completion as a first-class aggregate. As a result:

- Course completion must be inferred repeatedly from lesson rows.
- Certificate eligibility has no stable source of truth.
- Concurrent lesson completion can produce inconsistent aggregate state.
- Offline or failed progress syncs can create confusing learner experiences.
- Certificate generation lacks a durable audit trail.

This feature creates a production-grade completion model with explicit persistence, idempotency, concurrency handling, and certificate issuance states.

---

## Goals

- Persist lesson progress in the database for authenticated learners.
- Persist course completion state in `courses.course_progress`.
- Make certificate eligibility depend only on server-side state.
- Support safe retries for progress syncs and certificate creation.
- Handle two-tab and poor-network scenarios without losing progress.
- Keep the implementation maintainable through CQRS, repository ports, policies, specifications, and mappers.
- Provide a migration/backfill path for existing lesson progress.

---

## Non-Goals

- Build the final certificate visual design.
- Add a payment or checkout system.
- Redesign the lesson player UI.
- Add quiz, assignment, or optional lesson completion rules in the first release.
- Automatically issue certificates for all backfilled completions.

---

## User Stories

### Learner Progress

As an enrolled learner, I want my lesson progress to persist across refreshes, devices, and sessions so I can continue a course without losing progress.

### Course Completion

As an enrolled learner, I want the course to become completed when I finish all required lessons so the course page and profile reflect my achievement.

### Certificate Eligibility

As a learner who completed a course, I want to generate a certificate from a clear CTA so I can view or share proof of completion.

### Offline Recovery

As a learner on a poor connection, I want my completion action to retry safely so my progress is not lost if the network fails.

### Operations And Support

As an admin/support user, I want certificate metadata to explain how and when completion was determined so support cases can be resolved accurately.

---

## Functional Requirements

### Lesson Progress

- The system must persist lesson progress per `(userId, lessonId)`.
- The system must validate that the lesson belongs to the target course before writing progress.
- The system must validate active enrollment before accepting new progress writes.
- The system must mark a video lesson complete when the server-accepted progress reaches the completion threshold.
- The system must preserve the first valid `completed_at` timestamp.

### Course Progress

- The system must persist one course progress aggregate per `(userId, courseId)`.
- The aggregate must include status, completed lesson count, required lesson count, progress percentage, completion timestamp, certificate eligibility timestamp, version, curriculum version, and backfill marker.
- The system must update course progress atomically with lesson progress writes.
- The system must use optimistic concurrency with bounded retries.
- The system must make course completion idempotent.

### Certificate Eligibility And Issuance

- The system must expose certificate eligibility separately from issued certificate state.
- The system must issue certificates only when course progress is server-confirmed complete.
- Certificate creation must be idempotent per `(userId, courseId)`.
- The system must store certificate metadata snapshots, including completion source.
- Certificate numbers are opaque public IDs verified by database lookup.

### Idempotency

- Progress sync requests must include `clientEventId`.
- `clientEventId` deduplicates one HTTP request intent, not the entire lesson state.
- Replaying the same event with the same request hash must return the stored response.
- Replaying the same event with a different request hash must return `409 Conflict`.

### Offline And Retry

- The client must store unsynced progress events in IndexedDB.
- The client must retry with exponential backoff.
- Completion events must not be dropped silently.
- Certificate CTA must not appear from local-only completion state.

### Course Publish State

- Public progress APIs must not ship until product signs off on unpublished/deleted course behavior.
- Default engineering recommendation: reject new progress writes for unpublished or archived courses with `409 COURSE_NOT_ACTIVE` while preserving existing progress rows.

---

## Non-Functional Requirements

### Maintainability

- Use Clean Architecture / Ports and Adapters.
- Use CQRS for progress command and query paths.
- Keep Drizzle schema imports out of domain contracts and application services.
- Keep route handlers thin.
- Use policy/specification objects for business rules.
- Use mappers between DB rows, domain snapshots, and API DTOs.

### Reliability

- Progress writes must be idempotent.
- Certificate creation must be idempotent.
- Concurrent final-lesson completion must produce exactly one course completion transition.
- Backfill must be dry-run on a production replica before migration.

### Performance

- Progress write path should do one lesson upsert, one indexed completed-count query, and one aggregate update in the common case.
- Required lesson count should be cached on course/curriculum metadata and recomputed in admin publish/update flows.
- Profile and course card reads should use `course_progress`, not scan lesson progress rows.

### Observability

- Progress sync must emit structured logs, metrics, and OpenTelemetry spans.
- Certificate issuance must emit metrics and structured events.
- Alerts must cover fast error spikes and rolling error rates.

---

## Acceptance Criteria

- A learner can complete a lesson, refresh, and see the lesson remain complete.
- A learner can complete all required lessons and receive a server-confirmed course completion state.
- Two tabs completing lessons concurrently do not lose aggregate updates.
- A retry of the same progress request is idempotent.
- A retry of certificate issuance returns the existing certificate if it was already created.
- The certificate CTA has loading, success, retryable failure, and blocked failure states.
- Backfilled course progress rows are marked with `completed_by_backfill = true`.
- Backfilled certificates include `completion_source = "backfill_approximate"`.
- New progress and certificate APIs are implemented as resource-specific routes.
- The `docs/` folder does not contain implementation plans or feature specs for this work.

---

## Phase Gates

### Phase 1 - Schema

Approved to begin.

Must deliver:

- `course_progress`
- `progress_sync_events`
- `certificates`
- required constraints and indexes
- dry-run-safe backfill plan

### Phase 2 - Domain

Can begin after Phase 1 schema review.

Must deliver:

- command/query services
- repository interfaces
- completion policies/specifications
- optimistic concurrency retry behavior
- certificate service

### Phase 3 - API

Blocked until product signs off on unpublished/deleted course behavior.

Must deliver:

- progress sync route
- progress read route
- certificate eligibility route
- certificate creation route
- event-type-aware rate limits

### Phase 4 - Frontend

Must deliver:

- server hydration
- IndexedDB retry queue
- progress/course UI states
- certificate issuance state machine

### Phase 5 - Certificate Rendering

Must deliver:

- certificate detail page
- verification page
- metadata snapshot display/supportability

