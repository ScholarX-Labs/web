# Data Model: Course Application Form

## CourseApplication

Represents one learner's application to enroll in a course that requires a form.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Application identity |
| courseId | UUID | Yes | Course being applied to |
| userId | string | Yes | Authenticated learner |
| status | enum | Yes | pending, reviewing, approved, rejected, waitlisted, withdrawn |
| fullName | string | Yes | Applicant-provided display name |
| age | integer | Yes | Must be realistic and positive |
| email | string | Yes | Valid email format |
| phone | string | Yes | Valid phone format |
| learnerStatus | enum | Yes | high_school, undergraduate, graduate, professional |
| highSchoolName | string | Conditional | Required for high_school |
| university | string | Conditional | Required for undergraduate and graduate |
| faculty | string | Conditional | Required for undergraduate and graduate |
| graduationYear | integer | Conditional | Required for graduate |
| workField | string | Conditional | Required for professional |
| yearsOfExperience | integer | Conditional | Required for professional; non-negative |
| personalStatement | text | Yes | "Some words about them" |
| learningGoals | text | Yes | What the applicant wants to achieve |
| background | text | Yes | Relevant background context |
| formVersion | string | Yes | Default course application form version |
| extraAnswers | object | No | Controlled future extension only |
| sourceSurface | string | No | Enrollment CTA source |
| idempotencyKey | string | No | Retry safety |
| submittedAt | timestamp | Yes | Submission time |
| reviewedAt | timestamp | No | Last review decision time |
| reviewedBy | string | No | Admin reviewer |
| reviewNotes | text | No | Internal admin notes |
| createdAt | timestamp | Yes | Creation time |
| updatedAt | timestamp | Yes | Last update time |

## Relationships

- CourseApplication belongs to one Course.
- CourseApplication belongs to one User.
- CourseApplication may be reviewed by one Admin user.
- Course enrollment eligibility reads CourseApplication status for required-form courses.

## Constraints

- At most one active application per course and user, enforced by a DB partial unique index.
- Active statuses are pending, reviewing, approved, and waitlisted.
- Rejected or withdrawn applications remain historical records.
- Server validation enforces all conditional required fields.
- Admin status updates must use bounded transitions.
- `extraAnswers` must conform to a versioned schema for the stored `formVersion`; arbitrary unvalidated JSON is not allowed.
- Free-text fields must have maximum lengths and must be rendered as text in admin surfaces.

## Required Indexes

| Index | Purpose |
|-------|---------|
| Unique partial `(courseId, userId) WHERE status IN ('pending','reviewing','approved','waitlisted')` | Prevent duplicate active applications under concurrency |
| `(userId, courseId)` | Fast learner application status checks |
| `(courseId, status, submittedAt DESC)` | Admin course/status review queues |
| `(status, submittedAt DESC)` | Global admin status queues |
| `(learnerStatus, submittedAt DESC)` | Optional learner-status filter if shipped in V1 |
| `(userId, courseId, idempotencyKey) WHERE idempotencyKey IS NOT NULL` | Retry and idempotency lookup |

## Read Models

### CourseApplicationListItem

Compact admin list row. It must not include full narrative fields.

- id
- courseId
- courseTitle
- applicantName
- applicantEmail
- learnerStatus
- status
- submittedAt

### CourseApplicationDetail

Full admin detail read model. It includes all submitted fields and review metadata.

- all `CourseApplicationListItem` fields
- age
- phone
- conditional education or professional details
- personalStatement
- learningGoals
- background
- reviewedAt
- reviewedBy
- reviewNotes

`conditionalEducation` must be a discriminated union serialized with a `type` field:

- `{ type: "high_school", highSchoolName }`
- `{ type: "undergraduate", university, faculty }`
- `{ type: "graduate", university, faculty, graduationYear }`
- `{ type: "professional", workField, yearsOfExperience }`

## Review History

V1 stores the latest review decision on `CourseApplication` through `status`, `reviewedAt`, `reviewedBy`, and `reviewNotes`.

A separate immutable review-event history table is deferred unless compliance, support, or audit requirements demand full reconstruction of every review transition before launch. If added later, it should record application ID, previous status, next status, reviewer, notes, and timestamp.

## Status Transitions

```text
pending -> reviewing
pending -> approved
pending -> rejected
pending -> waitlisted
reviewing -> approved
reviewing -> rejected
reviewing -> waitlisted
waitlisted -> approved
waitlisted -> rejected
approved -> withdrawn
rejected -> withdrawn
```

Direct transition back to pending is not allowed; create a new application cycle only through an explicit future reapplication policy.
