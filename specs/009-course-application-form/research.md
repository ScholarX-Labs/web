# Research: Course Application Form

## Decision: Use A Dedicated Course Applications Table

**Rationale**: Required-form enrollment is not a generic sales inquiry. It is a first-class enrollment gate with unique constraints, review status, conditional applicant data, and learner-visible status. A dedicated table supports correctness, reporting, admin review, and scale.

**Alternatives considered**:

- Reuse generic inquiries: rejected because it mixes operational sales/contact messages with enrollment eligibility and weakens reporting.
- Store only JSON blobs: rejected because core fields need validation, filtering, indexing, and typed review workflows.

## Decision: Use Existing Enrollment Modal + Priority Window As UI Foundation

**Rationale**: The strongest existing UI component for this feature is `PriorityEnrollmentWindow`, because it already demonstrates the desired premium modal depth, colorful progress treatment, course context, and cinematic entrance language. `EnrollModalContent` is the best structural foundation because it already integrates with the enrollment lifecycle and reduced-motion-aware modal transitions.

**Alternatives considered**:

- Build a separate full-screen application page: rejected for v1 because it fragments the current course enrollment experience.
- Use the current `CourseApplicationForm` as-is: rejected because it is functional but too plain and too long for the requested world-class UI.
- Import unrelated UI component patterns wholesale: rejected because the current enrollment system already has a strong local visual language.

## Decision: Use Multi-Step Guided Form Instead Of Long Single Form

**Rationale**: The requested application collects many fields. A single long form will feel administrative and increase abandonment. A 4-step guided modal keeps the flow scannable: Identity, Status, Story, Goals & Review.

**Alternatives considered**:

- Single scroll form: rejected because it does not match the premium UX requirement and is harder to validate progressively.
- One field per screen: rejected because it creates too many steps for a relatively standard application.

## Decision: Apply Liquid-Glass Depth, Not Full Liquid-Glass Complexity

**Rationale**: UI research recommended a liquid-glass direction, but full morphing glass, chromatic effects, and constant iridescent motion are too heavy for an application form. The usable portion is frosted glass depth, layered highlights, colorful progress accents, and smooth transitions.

**Alternatives considered**:

- Full liquid-glass animation system: rejected for performance, accessibility, and maintenance risk.
- Plain white form: rejected because it does not satisfy the requested premium, colorful, animated experience.

## Decision: Keep ScholarX Typography Instead Of Playful Education Fonts

**Rationale**: UI search suggested a playful education pairing in one result, but ScholarX course enrollment is a professional learner workflow. Existing project typography should remain the baseline, with hierarchy, weight, and spacing doing the work.

**Alternatives considered**:

- Baloo/Comic-style playful typography: rejected as too childlike for scholarship/course applications.
- New premium font dependency: deferred because typography changes should be project-wide, not scoped to one modal.

## Decision: Use A Hybrid Typed + Versioned Form Model

**Rationale**: ScholarX already knows the required canonical fields. Typed fields preserve type safety, validation, indexing, and analytics. A version marker and controlled extension metadata allow future course-specific form templates without breaking historical submissions.

**Alternatives considered**:

- Fully flexible form builder from day one: rejected as overengineering for one known form and risky for type safety.
- Fully hardcoded fields forever: rejected because future course-specific questions would require repeated schema churn.

## Decision: Server-Side Enrollment Gate Is Authoritative

**Rationale**: The UI can guide users to the form, but users can still hit endpoints directly. The enrollment service must reject direct enrollment for required-form courses unless the application requirement is satisfied.

**Alternatives considered**:

- Client-only modal routing: rejected because it is bypassable and does not protect the business rule.

## Decision: Admin Review Is Separate From Course Catalog UI

**Rationale**: Applicant details are private operational data. They belong in authenticated admin workflows with filtering, pagination, audit context, and bounded status transitions.

**Alternatives considered**:

- Expose application status through public course responses: rejected due to privacy and caching risk.

## Decision: Approval Enables Enrollment Confirmation, Not Silent Enrollment

**Rationale**: Users should explicitly confirm enrollment after approval. This avoids surprise enrollment records and preserves a clear user action for joining the course.

**Alternatives considered**:

- Auto-enroll immediately on approval: deferred because it introduces notification, payment, and access timing questions outside the core application-gate scope.

## Decision: Enforce Duplicate Prevention At The Database Layer

**Rationale**: Application-level duplicate checks are race-prone during double-clicks, retries, or campaign spikes. The active-application rule must be enforced by a partial unique index on course and user for active statuses.

**Alternatives considered**:

- Service-only duplicate checks: rejected because concurrent requests can pass the check before either insert commits.
- Unique index on all course/user rows: rejected because it prevents future historical reapplication policies after rejection or withdrawal.

## Decision: Version The API At Launch

**Rationale**: The application contract includes private applicant fields and admin workflows. Versioning with `/api/v1/...` gives future form template and review changes a safe migration path.

**Alternatives considered**:

- Unversioned routes: rejected because breaking response or validation changes become painful after clients depend on them.
- Header-only versioning: deferred because path versioning is more visible and easier for current route conventions.

## Decision: Standardize Error Envelope And Field Errors

**Rationale**: The stepper UI needs field-level errors and consistent messages. A standard `{ success, requestId, error }` envelope avoids one-off parsing in client components and supports contract tests.

**Alternatives considered**:

- Ad hoc error responses per endpoint: rejected because it increases UI branching and weakens observability.

## Decision: Treat Applicant Data As PII

**Rationale**: Name, age, email, phone, education, work details, and narrative fields identify or describe a person. They require controlled admin-only access, safe rendering, log hygiene, and retention/deletion policy before production launch.

**Alternatives considered**:

- Treat applications as generic form messages: rejected because it ignores privacy and compliance obligations.

## Decision: Use Narrow Ports With One V1 Repository Implementation

**Rationale**: Splitting ports by use case preserves interface segregation and keeps admin/list/detail/enrollment services from depending on methods they do not need. For V1, one Drizzle-backed repository may implement multiple ports to avoid unnecessary adapter count, as long as services receive only the narrow interface they require.

**Alternatives considered**:

- One broad repository interface injected everywhere: rejected because it erodes the anti-corruption boundary over time.
- Separate physical adapter classes for every port immediately: deferred because it adds wiring cost before the implementation proves the need.

## Decision: Defer Immutable Review History Table For V1

**Rationale**: The current requirement needs latest review state for learner and admin workflows. A full review-event ledger is valuable for audit-heavy workflows, but it is not necessary to safely gate enrollment in V1.

**Alternatives considered**:

- Add review history table now: deferred unless compliance/support requires full transition reconstruction before launch.
- Store no reviewer metadata: rejected because latest reviewer identity is needed for admin UI and accountability.
