# Quickstart: Course Application Form

## Prerequisites

- A course exists with the form requirement enabled.
- A signed-in learner account exists.
- An admin account exists for review testing.

## Learner Flow

1. Open a required-form course page.
2. Select the primary enrollment call to action.
3. Confirm that the application stepper opens instead of direct enrollment.
4. Confirm the modal follows the premium enrollment visual language: glass surface, colorful progress accent, visible labels, and smooth reduced-motion-aware transitions.
5. Fill common fields: name, age, email, phone, learner status, personal statement, learning goals, and background.
6. Select each learner status and verify conditional fields:
   - High School requires high school name.
   - Undergraduate requires university and faculty.
   - Graduate requires university, faculty, and graduation year.
   - Professional requires work field and years of experience.
7. Move backward and forward through the stepper and confirm field state is preserved.
8. Submit the form.
9. Confirm that the learner sees a submitted or pending-review state.
10. Refresh and try again; confirm duplicate active applications are not created.

## Enrollment Gate Check

1. Attempt direct free enrollment for the required-form course without an approved application.
2. Confirm the response indicates an application is required.
3. Use a course without the form requirement enabled.
4. Confirm normal enrollment still works.
5. Attempt two application submits for the same learner and course at the same time.
6. Confirm only one active application exists.

## Admin Review Flow

1. Open the admin course applications review list.
2. Filter by course and status.
3. Open the submitted application.
4. Confirm all common and conditional fields are visible.
5. Change status to reviewing, approved, rejected, or waitlisted.
6. Confirm the response includes the reviewer identity for optimistic UI updates.
7. Confirm learner status reflects the admin decision.
8. Confirm free-text applicant fields render as text, not executable markup.

## UI Quality Check

1. Test at 375px, 768px, 1024px, and 1440px widths.
2. Test light and dark modes.
3. Test with reduced motion enabled.
4. Test keyboard-only navigation through all fields and controls.
5. Verify no text overlaps or truncates inside buttons, cards, progress rail, or modal header.
6. Verify only Lucide/SVG icons are used; no emoji icons are used as UI controls.

## API Contract Check

1. Submit a valid application through `/api/v1/courses/{courseId}/enroll/application`.
2. Confirm the response uses `{ success, requestId, data }`.
3. Submit invalid fields and confirm the response uses `{ success, requestId, error }`.
4. Confirm field-level validation errors are keyed by field name.
5. Submit repeatedly past the configured rate limit and confirm a `RATE_LIMITED` error.
6. Confirm the `RATE_LIMITED` response uses HTTP `429` and includes `Retry-After`.
7. Reuse an idempotency key for the same learner/course and confirm the response is safe and non-duplicating.
8. Reuse the same idempotency key for a different learner or course and confirm it cannot replay another user's response.
9. Confirm expired idempotency keys are treated as new requests while the active-application uniqueness still prevents duplicate active applications.
10. Confirm admin detail responses serialize conditional details with a `type` discriminator.

## Data And Scale Check

1. Confirm the migration creates the partial unique active-application index.
2. Confirm admin filter indexes exist for course, status, learner status, and submitted date ordering.
3. Seed application rows at or above the 50,000-user target.
4. Confirm admin list pagination returns compact rows without narrative fields.
5. Confirm admin detail loads narrative fields only after selecting one application.
6. Run a concurrency test that submits duplicate applications for the same learner/course.
7. Run a campaign-style load test for many users applying to one course.
8. Confirm connection pool size, query timeout, and rate-limit thresholds are documented before endpoints are enabled.

## Verification Commands

```powershell
pnpm run typecheck
pnpm run test
```

Run focused tests for application validation, route handlers, enrollment gate behavior, admin status transitions, API contract envelopes, rate limiting, and DB-level duplicate protection as they are added.
