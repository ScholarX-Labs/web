# Implementation Plan: Course Application Form

**Branch**: `009-course-application-form` | **Date**: 2026-05-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/009-course-application-form/spec.md`

## Summary

Required-form courses need an application gate that feels premium rather than administrative. The plan is to implement a secure, typed, server-enforced course application workflow and present it through a world-class multi-step application modal with liquid-glass depth, colorful ScholarX accents, guided progress, conditional fields, and cinematic but restrained motion.

The best existing UI base is the current course enrollment modal system, specifically `EnrollModalContent` for modal structure and `PriorityEnrollmentWindow` for premium motion language. The current `CourseApplicationForm` is useful as a functional baseline, but it should be redesigned into a polished stepper experience.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js App Router  
**Primary Dependencies**: Better Auth, Drizzle ORM, Zod, React Hook Form, TanStack React Query, Framer Motion, Lucide icons, existing ScholarX UI primitives  
**Storage**: PostgreSQL through Drizzle schema and migrations  
**Testing**: Node test runner with `tsx`, TypeScript typecheck, focused route/service/component tests, visual checks for responsive modal states  
**Target Platform**: ScholarX web application with public course pages, authenticated learner flows, and admin operations  
**Project Type**: Full-stack web application  
**Performance Goals**: Application form opens with no perceived lag; validation feedback appears immediately; admin review remains usable at 50,000 users  
**Constraints**: Preserve public/auth/admin separation, avoid private applicant data in public payloads, keep route handlers thin, keep validation authoritative on the server, respect reduced motion, enforce DB-level duplicate protection, rate-limit submit traffic  
**Scale/Scope**: 50,000 users, high-volume course campaigns, one active application per learner per course, multi-step application UX

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Plan Response |
|-----------|--------|---------------|
| Proper Architecture & SOLID Patterns | PASS | Use application service, repository, form schema, enrollment policy, anti-corruption DTOs, and UI component boundaries. |
| Code Quality & Type Safety | PASS | Use discriminated union validation by learner status, typed DTOs, and explicit component props. |
| Rigorous Testing Standards | PASS | Cover validation matrix, direct enrollment blocking, idempotency, route handlers, application status, and critical UI states. |
| Premium UX Consistency | PASS | Base the experience on existing cinematic enrollment modal patterns, with guided steps, clear hierarchy, Lucide icons, and accessible motion. |
| Performance, Scalability & Maintainability | PASS | Dedicated indexed persistence, paginated admin review, lightweight synchronous submit, and no slow side effects in the submit path. |

## Project Structure

### Documentation (this feature)

```text
specs/009-course-application-form/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── course-application-api.md
│   └── course-application-ui.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/courses/[[...path]]/route-handlers.ts
│   └── admin/course-applications/
├── components/
│   ├── courses/
│   │   ├── course-application-form.tsx
│   │   ├── course-application-stepper.tsx
│   │   ├── course-application-status.tsx
│   │   ├── enroll-modal.tsx
│   │   └── priority-enrollment-window.tsx
│   └── admin/
├── db/schema/
├── domain/
│   ├── courses/
│   │   ├── application/
│   │   ├── contracts/
│   │   └── infrastructure/db/
│   └── admin/
├── lib/
│   ├── api/
│   └── enrollment/
└── stores/

drizzle/
└── migrations for course application tables and indexes
```

**Structure Decision**: Course application submission belongs to the courses domain because it gates enrollment. Admin review belongs to the admin domain and consumes course application read models through an anti-corruption layer instead of sharing raw persistence objects. UI components stay feature-local under `src/components/courses` unless a primitive proves reusable.

## UI/UX Direction

### Chosen Existing UI Foundation

Use `PriorityEnrollmentWindow` as the strongest visual reference because it already contains:

- layered glass modal treatment
- premium dark overlay with blur
- cinematic entrance motion
- colorful cyan, hero-blue, and orange progress accents
- structured processing feedback
- course thumbnail and trust-style detail presentation

Use `EnrollModalContent` as the structural base because it already handles:

- dialog overlay integration
- reduced-motion-aware Framer Motion variants
- success and processing states
- shared enrollment modal lifecycle

Use the current `CourseApplicationForm` only as a functional starting point. It is currently a simple single-column form and should be upgraded to the multi-step experience below.

### Visual Language

Adopt a "premium liquid glass application dossier" direction:

- frosted white/dark glass panel with high contrast text
- subtle cyan, hero-blue, emerald, and orange accents
- step-specific iconography from Lucide
- compact trust badges for "Application required", "Secure review", and "No payment at this stage"
- animated progress rail that never shifts layout
- polished success state with clear pending-review outcome

Avoid:

- emojis as UI icons
- heavy bokeh/orb backgrounds
- animated everything at once
- playful children-oriented fonts
- long ungrouped forms that feel like paperwork

### Form Interaction Model

Use a 4-step guided modal:

1. **Identity**: full name, age, email, phone
2. **Status**: learner status segmented control with conditional fields
3. **Story**: personal statement and background
4. **Goals & Review**: learning goals plus review summary before submit

The modal should show:

- left or top progress rail depending on viewport
- stable step dimensions with scroll only inside the form body
- field-level validation summaries
- back/next controls with clear disabled states
- submit loading state and success state

### Motion Plan

Use restrained Framer Motion:

- modal entrance: opacity, scale, y with existing spring/ease settings
- step transition: horizontal slide + fade, 220-320ms
- progress rail: width/scale transform only
- conditional fields: height/opacity reveal with reduced-motion fallback
- success: short scale/fade only

Rules:

- Respect `prefers-reduced-motion`.
- Animate at most 1-2 meaningful elements per step.
- No perpetual decorative motion except submit/loading indicators.
- Avoid layout-shifting hover scale on form controls.

### Color And Typography

Use ScholarX existing typography and theme tokens. Do not adopt the UI search's playful Baloo/Comic pairing.

Recommended palette direction:

- primary trust blue: current `hero-blue`
- secondary cyan: for progress and focus accents
- orange: for application CTA emphasis
- emerald: for success and approved states
- slate/white: for surfaces and readable body text

This aligns with the current enrollment UI and avoids a one-note palette.

## Architecture

### Bounded Contexts

**Courses domain**

- Owns application-required policy.
- Owns application submission validation and idempotent creation.
- Owns learner application status query.
- Rejects direct enrollment when a required application is missing or unsatisfied.

**Admin domain**

- Owns review list, detail page, and status transitions.
- Records reviewer identity and review notes.
- Does not duplicate course enrollment policy.
- Depends on narrow course application review ports rather than raw course repositories.

**UI layer**

- Course CTA derives whether to say "Apply Now", "Application Pending", or "Resume Learning".
- Application modal renders a stepper based on typed form state.
- Application status component handles pending, reviewing, approved, rejected, waitlisted, and enrolled states.

### Design Patterns

- **Strategy**: Enrollment executor chooses free, paid, inquiry, or application flow.
- **Repository**: Persistence hidden behind course application repository.
- **Factory**: Domain factory wires services.
- **Policy/Specification**: Application-required and application-satisfied checks are named policies.
- **DTO Mapper**: Database rows are normalized before reaching UI.
- **State Machine**: Application review and learner-facing enrollment states are explicit transitions.

### Boundary DTOs And Ports

The admin domain must not consume raw `course_applications` rows. It receives stable read models:

```ts
type CourseApplicationListItem = {
  id: string;
  courseId: string;
  courseTitle: string;
  applicantName: string;
  applicantEmail: string;
  learnerStatus: LearnerStatus;
  status: CourseApplicationStatus;
  submittedAt: string;
};

type CourseApplicationDetail = CourseApplicationListItem & {
  age: number;
  phone: string;
  conditionalEducation: HighSchoolDetails | UndergraduateDetails | GraduateDetails | ProfessionalDetails;
  personalStatement: string;
  learningGoals: string;
  background: string;
  reviewedAt: string | null;
  reviewedBy: { id: string; name: string } | null;
  reviewNotes: string | null;
};
```

Each `conditionalEducation` variant must serialize with a discriminant:

```ts
type HighSchoolDetails = {
  type: "high_school";
  highSchoolName: string;
};

type UndergraduateDetails = {
  type: "undergraduate";
  university: string;
  faculty: string;
};

type GraduateDetails = {
  type: "graduate";
  university: string;
  faculty: string;
  graduationYear: number;
};

type ProfessionalDetails = {
  type: "professional";
  workField: string;
  yearsOfExperience: number;
};
```

Ports should be split by use case to preserve interface segregation:

- `CourseApplicationListReadPort`: paginated/filterable compact rows only.
- `CourseApplicationDetailReadPort`: full narrative/detail read model by application ID.
- `CourseApplicationReviewWritePort`: bounded status transitions and review notes.
- `ApplicationEnrollmentGatePort`: learner-facing application status used by enrollment services.

V1 wiring expectation: one concrete Drizzle-backed repository may implement multiple narrow ports to avoid adapter sprawl, but services must depend on the narrow port interfaces. Do not inject a broad repository into admin or enrollment services.

Enrollment strategies must remain substitutable through a shared result contract: every strategy returns either a typed success with `mode` and `nextAction` or a typed failure with `mode`, `code`, and `message`.

## Data Storage Decision

Use a hybrid data model:

- Dedicated `course_applications` table with typed canonical fields.
- `form_version` for historical compatibility.
- Optional controlled `extra_answers` metadata for future course-specific extensions.

This is the best fit for 50,000 users because typed fields enable validation, indexing, admin filtering, reporting, and duplicate prevention. Fully flexible JSON is too weak for core business fields. Hardcoded templates alone are too brittle for future growth.

### Required Persistence Constraints And Indexes

Migrations must include DB-level protection, not only application checks:

- Partial unique index: `(course_id, user_id)` where `status IN ('pending', 'reviewing', 'approved', 'waitlisted')`.
- Lookup index: `(user_id, course_id)` for learner status checks.
- Admin filter index: `(course_id, status, submitted_at DESC)`.
- Admin status queue index: `(status, submitted_at DESC)`.
- Learner status filter index: `(learner_status, submitted_at DESC)` if the admin UI exposes this filter in V1.
- Idempotency index: `(user_id, course_id, idempotency_key)` where `idempotency_key IS NOT NULL`.

`extra_answers` must be validated against a versioned Zod schema or JSON Schema before persistence. Raw arbitrary JSON is not allowed as an extension boundary.

## Enrollment State Machine

```text
not_enrolled
  ├─ requiresForm=false -> normal enrollment
  └─ requiresForm=true
       ├─ no_application -> show application stepper
       ├─ pending/reviewing -> show pending-review status
       ├─ waitlisted -> show waitlist status
       ├─ rejected -> show rejected/follow-up status
       └─ approved -> allow explicit enrollment confirmation
```

V1 policy: approved applications satisfy the gate, but users still confirm enrollment explicitly. No silent enrollment.

## API And Route Plan

Route handlers remain thin:

1. Resolve authenticated user.
2. Parse and validate request body.
3. Call the course application service.
4. Return typed response.

Planned endpoints:

- `POST /api/v1/courses/:courseId/enroll/application`
- `GET /api/v1/courses/:courseId/enroll/application/status`
- `GET /api/v1/admin/course-applications`
- `GET /api/v1/admin/course-applications/:applicationId`
- `PATCH /api/v1/admin/course-applications/:applicationId/status`

### API Rules

- All endpoints return the standard envelope defined in `contracts/course-application-api.md`.
- Field validation errors return `fieldErrors` keyed by request field.
- Submit endpoint is rate-limited per authenticated user, course, and IP-derived abuse key.
- `Idempotency-Key` or body `idempotencyKey` must be a UUID-like opaque value scoped to the authenticated user and course.
- Idempotency keys should be retained for at least 24 hours and must not replay across a different user or course.
- After the idempotency retention window expires, the same key is treated as a new request; correctness is still protected by the active-application partial unique index.
- Rate-limited responses must use HTTP `429`, include `Retry-After`, and return a friendly `RATE_LIMITED` envelope.
- Breaking API changes require a new version path or backward-compatible response extension.

## UI Component Plan

### CourseApplicationStepper

Responsibilities:

- render step progress
- coordinate step navigation
- expose current step validity
- preserve typed form state
- handle reduced-motion step transitions

### CourseApplicationForm

Responsibilities:

- own React Hook Form wiring
- render grouped step content
- display field-level validation
- call application submit strategy
- show success or submitted state

### CourseApplicationStatus

Responsibilities:

- render existing application state
- provide next action by status
- avoid resubmission when active application exists

### AdminCourseApplicationsTable

Responsibilities:

- paginated application review list
- filters for course, status, learner status, and search
- compact row display without loading full narrative fields

### AdminCourseApplicationDetail

Responsibilities:

- full submitted application read view
- status transition controls
- internal review notes
- audit-safe display of reviewer and timestamps

## Scalability Plan For 50,000 Users

- Dedicated application table with the explicit indexes listed above.
- Unique active application constraint by learner and course at DB level.
- Idempotency key support for retries.
- Paginated admin list with narrow `CourseApplicationListItem` row payload.
- Optional short-lived cache for admin list queries by `(courseId, status, learnerStatus, page, limit)` once write volume and review freshness requirements are measured.
- Read replica routing is acceptable for admin list/detail reads if primary DB load becomes a bottleneck.
- Database connection pooling must use bounded pool size and query timeouts so campaign spikes cannot exhaust server resources.
- Pool size and query timeout values are a required infrastructure decision before endpoint implementation begins.
- No email sending, notification fanout, or external calls in the synchronous submit path.
- Future notifications should run asynchronously.

## Security And Privacy

- Auth required for application submit/status.
- Admin authorization required for review using role-based access in V1.
- Future course-specific reviewer assignment should be modeled as an attribute-based authorization extension, not hardcoded into the review UI.
- Applicant details never included in public course payloads.
- No full applicant narratives in logs.
- Public caches must not store learner-specific application states.
- Free-text fields must be rendered as text, never HTML. If rich text is introduced later, sanitize at render and persist only approved markup.
- Admin UI must output-encode personal statements, learning goals, background, and review notes.
- PII fields include full name, age, email, phone, school/university/faculty/work details, and narrative answers.
- Retention policy must be documented before launch. V1 default: retain submitted application records for operational review, but support removal/anonymization for account deletion and privacy requests.
- Server-side validation must trim and length-limit free-text fields to prevent oversized payload abuse.
- V1 stores latest review status on the application row. A full review-event history table is explicitly deferred unless compliance or support workflows require reconstructing every status transition before launch.

## Testing Strategy

Unit tests:

- learner-status validation matrix
- application-required policy
- application-satisfied policy
- review status transition rules
- enrollment mode derivation

Route/service tests:

- valid application submit
- missing conditional fields rejected
- duplicate active application rejected or returned idempotently
- concurrent duplicate submits result in one active row because of the DB partial unique index
- direct enrollment blocked for required-form course
- non-required-form enrollment preserved
- admin status update authorization and validation
- standard error envelope and field errors are returned consistently
- rate limit returns a clear abuse-control error

Component tests:

- modal opens stepper for required-form course
- status segmented control reveals correct fields
- back/next behavior preserves state
- submit disabled while invalid/submitting
- submitted status renders after success

Visual QA:

- 375px, 768px, 1024px, 1440px
- light and dark modes
- keyboard-only navigation
- reduced motion
- long course titles and long field labels
- visual regression baseline for the application modal open, each step, validation error state, submitting state, and success state

Load/concurrency tests:

- simulate repeated submits for the same learner/course and confirm only one active application row is created
- simulate campaign-style submissions across many users for one course and confirm submit latency and duplicate rate stay within success criteria
- exercise admin list pagination and filters with seeded data at or above the 50,000-user target

Contract tests:

- validate route handler responses against the documented success/error envelope
- validate request schemas against the same Zod schemas used by the domain boundary

## Rollout Plan

1. Add schema, domain contracts, and validation.
2. Add application service and repository.
3. Decide and document production connection pool size, query timeout, and rate-limit thresholds.
4. Add learner status endpoint and submission endpoint.
5. Redesign `CourseApplicationForm` into the stepper experience.
6. Wire required-form course CTA and modal status handling.
7. Add admin review list/detail.
8. Enable course application gating for selected courses.

## Risks And Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Long form reduces completion | Lower application conversion | Multi-step flow, progress rail, autosafe state retention, clear field grouping |
| Over-animated UI feels distracting | Poor accessibility and perceived quality | Animate only transitions and feedback; respect reduced motion |
| Generic inquiries become overloaded | Admin confusion and weak reporting | Use dedicated course applications table |
| Direct enrollment bypass remains open | Business rule failure | Enforce in course enrollment service |
| Admin list slows at scale | Operational bottleneck | Indexed filters and paginated row payload |
| Free-text fields introduce XSS risk | Admin account compromise | Render as text, output-encode, sanitize only if rich text is introduced |
| PII retention is undefined | Compliance and privacy risk | Document retention and deletion/anonymization policy before launch |
| Concurrent submissions bypass app checks | Duplicate active applications | Partial unique index and idempotency handling |

## Pre-Coding P0 Decisions

- Migration must include the partial unique active-application index.
- Migration must include explicit admin filter indexes.
- API must use `/api/v1/...` paths or an equivalent documented versioning strategy.
- Submit and review endpoints must use the standard response/error envelope.
- PII retention/deletion behavior must be documented before production launch.
- Free-text rendering must be output-encoded in admin surfaces.

## Complexity Tracking

No constitution violations. The added UI component boundaries and dedicated persistence are justified by the business gate, applicant privacy, admin review workflow, and 50,000-user scale target.
