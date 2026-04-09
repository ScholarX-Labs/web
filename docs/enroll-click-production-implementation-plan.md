# Enroll Click Journey Implementation Plan

## Scope

Define a production-grade implementation for what happens after a user clicks
Enroll in a course card, with clear behavior across desktop and mobile,
progressive enhancement for motion, deterministic state handling, and robust
fallbacks.

This plan covers:

- Card-level Enroll intent capture
- Detail surface and modal orchestration
- Authentication and enrollment transaction path
- Success, failure, retry, and recovery paths
- Accessibility, reduced-motion, performance, observability, and rollout

## Context Snapshot (Current State)

Current flow is partially implemented and already has strong primitives:

- Enroll intent routing via query string exists in
  src/components/courses/latest-course-card.tsx using
  ?intent=enroll.
- Detail page intent hydration exists in
  src/app/(platform)/courses/[slug]/page.tsx.
- Modal auto-open from intent exists in
  src/components/courses/enroll-modal.tsx.
- Surface orchestration exists in
  src/components/courses/course-detail-surface-portal.tsx and
  src/stores/course-sheet.store.ts.
- Enrollment UI state exists in src/stores/enrollment.store.ts.
- Desktop first-load ripple foundation exists in
  src/components/courses/course-grid.tsx.

Gap to close: standardize one canonical post-click pipeline so every entry point
(grid card, latest card, sticky CTA, hero CTA, direct deep link) behaves
identically and predictably.

## Product Outcomes

- Zero ambiguity between Details and Enroll intent
- Perceived instant response within 100ms of click feedback
- Authentication and transaction gating with no dead ends
- Deterministic return state after close, error, or success
- Accessible and reduced-motion equivalent experience
- Stable frame pacing during transitions on mid-tier devices

## Architectural Principles

### SOLID Mapping

- Single Responsibility:
  separate intent capture, state orchestration, enrollment execution, and visual
  animation primitives.
- Open/Closed:
  support new enrollment strategies (free, paid, application, coupon, waitlist)
  by adding strategy implementations, not rewriting modal shell.
- Liskov Substitution:
  all enrollment strategies expose same contract and are swappable.
- Interface Segregation:
  UI consumes minimal interfaces (IntentController, EnrollmentExecutor,
  ModalPresenter) instead of a single large service.
- Dependency Inversion:
  UI depends on abstractions; infrastructure adapters handle API and auth wiring.

### Required Design Patterns

- Strategy Pattern:
  enrollment action branch selection (free, paid-direct, paid-with-form).
- State Machine Pattern:
  lifecycle control for modal and transaction states.
- Adapter Pattern:
  motion capability fallback (View Transitions API available vs unavailable).
- Command Pattern:
  click action represented as EnrollIntentCommand for consistent telemetry and
  replay-safe behavior.
- Presenter Pattern:
  separate modal state presentation from business side effects.

## Target Domain Model

### Intent Model

- details
- enroll

Intent sources:

- Card Enroll CTA
- Card Details CTA
- Hero and sticky CTA
- Deep link with ?intent=enroll

### Enrollment State Machine

States:

- idle
- precheck
- auth_redirect
- modal_open
- processing
- success
- error
- closed

Transitions:

- idle -> precheck on enroll_click
- precheck -> auth_redirect when unauthenticated
- precheck -> modal_open when authenticated
- modal_open -> processing on primary CTA
- processing -> success on API success
- processing -> error on API failure
- success -> closed on dismiss or continue action
- error -> processing on retry
- modal_open -> closed on dismiss

Invariant rules:

- Only one enrollment mutation can run per course and user at a time.
- Closing modal never leaves store in processing state.
- Success state is idempotent and safe across refresh.

## End-to-End Post-Click Sequence

1. User clicks Enroll in card.
2. UI applies immediate feedback:
   pressed state, optional micro-scale, and interaction lock for the clicked
   surface.
3. Intent command is dispatched with metadata:
   courseId, sourceSurface, viewport, reducedMotion, timestamp.
4. On desktop:
   open detail surface with enroll intent and preserved originRect.
5. On mobile:
   navigate to canonical detail route with ?intent=enroll.
6. Precheck executes:
   enrollment eligibility, auth presence, existing subscription state.
7. If unauthenticated:
   redirect to sign-in with callbackUrl preserving intent.
8. After callback return:
   auto-open enrollment modal after bounded settle delay.
9. User confirms enrollment path:
   free enroll mutation, paid checkout handoff, or form path.
10. Transaction result:
    success ceremony or actionable error with retry.
11. Refresh dependent UI:
    CTA branch updates to Resume Learning where applicable.
12. Close sequence:
    restore focus to originating trigger and release interaction locks.

## Motion Choreography Contract

### First-Load Ripple for Course Grid

Required behavior:

- Controlled desktop cascade using row and column delay model
- No non-essential transforms for reduced-motion users
- No blocking of first meaningful paint

Implementation contract:

- Compute delay as row-major function using active desktop column count.
- Keep motion to opacity plus translateY only for first-load entry.
- Cap total cascade duration to avoid delayed interactability.
- Disable stagger for filtered updates where user expects immediate response.

### Enroll Click Motion

- Preserve FLIP-origin expansion from clicked card bounds.
- Sequence interior sheet content only after container expansion completion.
- For unsupported View Transition API:
  use thumbnail clone transition fallback.
- Use transform and opacity animations only; avoid layout-triggering properties.

## Accessibility Contract

- Full keyboard path for Enroll from card to completion.
- Deterministic focus restore to the original trigger on close.
- Escape closes modal from non-processing states only.
- ARIA live region for processing, success, and error messages.
- Respect prefers-reduced-motion with equivalent information hierarchy.
- Ensure contrast and hit-target sizes meet WCAG AA.

## Performance Contract

Budgets:

- Click feedback start: under 100ms
- Modal first render after intent: under 500ms on desktop warm path
- Main-thread long tasks during transition: zero tasks above 50ms target
- Animation frame stability: maintain 55+ fps on representative mid-tier
  hardware

Engineering rules:

- Use memoized motion configs and avoid recreating variant objects in render.
- Avoid expensive scroll listeners without throttling and passive handling.
- Keep enrollment store updates minimal and atomic.
- Preload modal-critical assets opportunistically on card hover/focus.

## Error Handling and Recovery

Error classes:

- auth_required
- already_enrolled
- network_transient
- validation_failure
- payment_unavailable
- unknown

Recovery behavior:

- auth_required:
  route to sign-in with preserved callback and intent.
- already_enrolled:
  show success-style state with Resume Learning action.
- network_transient:
  show retry CTA and preserve entered context.
- payment_unavailable:
  degrade to alternate CTA with support messaging.
- unknown:
  generic error shell plus correlation id.

## API and Contract Boundaries

Front-end contracts:

- EnrollmentExecutor.execute(courseId, mode)
- EnrollmentEligibility.check(course)
- IntentController.openEnroll(course, source)

Back-end expectations:

- Free enrollment endpoint is idempotent.
- Response includes enrollment state and next action token.
- Errors map to stable machine-readable codes.

## Implementation Plan by Phases

### Phase 1: Intent and State Foundations

- Introduce unified intent dispatch function for all Enroll entry points.
- Refactor enrollment store to explicit state machine states.
- Add source metadata and correlation id for each intent command.

### Phase 2: Motion and Surface Orchestration

- Normalize FLIP and fallback transition adapter behavior.
- Finalize first-load ripple desktop cascade and reduced-motion parity.
- Add deterministic lock and unlock sequencing for catalog interactions.

### Phase 3: Transaction Hardening

- Implement strategy-based enrollment execution paths.
- Add optimistic UI for free enrollment with safe rollback on failure.
- Ensure post-success refresh updates all dependent CTAs.

### Phase 4: Accessibility and Performance Hardening

- Complete keyboard, focus, and screen reader verification.
- Add performance instrumentation and regression thresholds.
- Optimize render paths and remove avoidable re-renders.

### Phase 5: Rollout and Guardrails

- Ship behind feature flag with staged ramp.
- Monitor errors, abandonment, and conversion metrics.
- Remove old path only after parity validation.

## Testing Strategy

### Unit Tests

- State machine transition coverage
- Enrollment strategy selection and branching
- Intent metadata construction

### Integration Tests

- Enroll click from grid card to modal open
- Auth redirect and callback with preserved intent
- Success and retry paths

### E2E Tests

- Desktop FLIP path with enroll intent
- Mobile route intent path
- Reduced-motion path behavior parity
- Already-enrolled branch to Resume Learning

### Visual and Motion QA

- Frame pacing capture during card-to-sheet transition
- Ripple cascade consistency by breakpoint
- No layout shift during entrance and modal transitions

## Observability Plan

Track these events:

- enroll_click
- enroll_modal_opened
- enroll_auth_redirected
- enroll_submission_started
- enroll_submission_succeeded
- enroll_submission_failed
- enroll_modal_closed

Dimensions:

- courseId
- sourceSurface
- deviceClass
- reducedMotion
- networkType
- errorCode

Success metrics:

- Click-to-open latency
- Enroll conversion rate
- Drop-off by state
- Retry success rate

## Security and Reliability Guardrails

- Never trust client-side enrollment eligibility as authoritative.
- Validate user authorization server-side on every enrollment mutation.
- Use idempotency keys for mutation retries where applicable.
- Keep callbackUrl allowlisted and sanitized.
- Avoid leaking internal errors to user-facing messages.

## Migration and Compatibility

- Keep existing route contract unchanged:
  /courses/[slug]?intent=enroll.
- Preserve no-JS baseline navigation behavior.
- Ensure old CTA paths forward into new intent controller.
- Maintain backward compatibility with existing API response shapes.

## Definition of Done

- All Enroll entry points use one unified intent pipeline.
- State machine has complete transition test coverage.
- Accessibility checks pass for keyboard, SR, and reduced-motion.
- Performance budgets are met in CI and staging benchmarks.
- Error handling provides actionable outcomes for all known classes.
- Rollout metrics show no regression in conversion or stability.

## Immediate Next Actions

1. Align on state machine contract and event naming.
2. Implement unified intent dispatch in card and CTA entry points.
3. Refactor enrollment store to explicit lifecycle states.
4. Add telemetry hooks and baseline dashboards before ramp.
5. Execute phased rollout with feature-flag gating.

## Implementation Checklist (File-by-File)

Effort scale used in this section:

- S: 2 to 4 hours
- M: 0.5 to 1 day
- L: 1 to 2 days
- XL: 2 to 3 days

### Phase 1 Checklist: Intent and State Foundations

Estimated phase effort: 4 to 6 days

- [ ] src/stores/enrollment.store.ts
  Refactor to explicit lifecycle state machine: idle, precheck, auth_redirect,
  modal_open, processing, success, error, closed. Add typed transition actions,
  guard invalid transitions, and reset semantics. Estimate: L
- [ ] src/stores/course-sheet.store.ts
  Add source metadata and correlation id fields for each intent invocation.
  Preserve originRect and focus restoration target references. Estimate: M
- [ ] src/components/courses/latest-course-card.tsx
  Replace direct intent branching with unified intent dispatcher integration.
  Ensure desktop and modified-click fallback behavior remains intact.
  Estimate: M
- [ ] src/components/courses/course-card.tsx
  Route click path through shared IntentController for details and enroll
  consistency. Keep FLIP origin capture unchanged. Estimate: M
- [ ] src/app/(platform)/courses/[slug]/_components/course-hero.tsx
  Replace direct store modal open with shared intent command path.
  Estimate: S
- [ ] src/app/(platform)/courses/[slug]/_components/course-sticky-cta.tsx
  Replace direct store modal open with shared intent command path.
  Estimate: S
- [ ] src/components/courses/course-detail-surface-portal.tsx
  Harmonize intent propagation to use new state machine actions and
  correlation context. Estimate: M
- [ ] src/components/courses/enroll-modal.tsx
  Consume state machine status instead of boolean flags for rendering and
  control flow. Remove implicit coupling to local hasAutoOpened behavior where
  state machine can own it. Estimate: L
- [ ] src/lib/enrollment/intent-controller.ts (new)
  Create IntentController with openEnroll and openDetails orchestration,
  source metadata construction, and consistent command dispatch.
  Estimate: L
- [ ] src/lib/enrollment/types.ts (new)
  Add typed contracts for intent command payload, lifecycle states,
  transition events, and error classes. Estimate: S

### Phase 2 Checklist: Motion and Surface Orchestration

Estimated phase effort: 3 to 5 days

- [ ] src/components/courses/course-grid.tsx
  Finalize first-load ripple cascade contract by row and index for desktop,
  cap max delay, and disable stagger for dynamic filtering updates.
  Estimate: M
- [ ] src/components/courses/latest-course-card.tsx
  Ensure lock and unlock sequencing aligns with unified surface orchestration:
  interaction lock, contain layout, and guaranteed unlock on close.
  Estimate: M
- [ ] src/components/courses/course-card.tsx
  Align active-card dimming behavior and unlock lifecycle with portal close and
  cancellation paths. Estimate: M
- [ ] src/components/courses/course-detail-sheet.tsx
  Gate interior stagger until container expansion completes, and respect
  reduced-motion by removing non-essential transform choreography.
  Estimate: L
- [ ] src/components/courses/course-detail-surface-portal.tsx
  Add deterministic cleanup for document body locks and pointer-events in all
  close scenarios. Estimate: M
- [ ] src/components/animations/page-transition.tsx
  Implement adapter-based fallback for unsupported View Transition API where
  needed by enroll surface transitions. Estimate: M
- [ ] src/lib/motion/surface-transition-adapter.ts (new)
  Create capability adapter with typed API for supported and fallback motion
  pipelines. Estimate: L

### Phase 3 Checklist: Transaction Hardening

Estimated phase effort: 4 to 6 days

- [ ] src/components/courses/enroll-modal.tsx
  Extract action handling into strategy executor and normalize success and error
  message mapping from API error codes. Estimate: L
- [ ] src/lib/api/courses.service.ts
  Ensure enroll endpoints return stable machine-readable codes and idempotent
  semantics expected by front-end strategy executor. Estimate: M
- [ ] src/lib/enrollment/strategies/free-enroll.strategy.ts (new)
  Implement free enrollment strategy with optimistic UI and rollback behavior.
  Estimate: M
- [ ] src/lib/enrollment/strategies/paid-checkout.strategy.ts (new)
  Implement paid checkout handoff strategy with preflight validation and
  structured fallback errors. Estimate: M
- [ ] src/lib/enrollment/strategies/form-application.strategy.ts (new)
  Implement requiresForm strategy with routing handoff and recoverable state.
  Estimate: M
- [ ] src/lib/enrollment/enrollment-executor.ts (new)
  Add strategy selection, execution envelope, retries, and typed result mapping.
  Estimate: L
- [ ] src/lib/enrollment/error-mapper.ts (new)
  Centralize API error to UI error class mapping.
  Estimate: S
- [ ] src/app/(platform)/courses/[slug]/page.tsx
  Confirm server-rendered branch selection remains correct after enrollment
  success and refresh. Estimate: S

### Phase 4 Checklist: Accessibility and Performance Hardening

Estimated phase effort: 3 to 4 days

- [ ] src/components/courses/enroll-modal.tsx
  Add explicit ARIA live region status announcements for processing, success,
  and error transitions. Add deterministic escape behavior guards.
  Estimate: M
- [ ] src/components/courses/course-detail-sheet.tsx
  Ensure focus restoration uses original trigger and handles reverse FLIP timing
  safely. Estimate: M
- [ ] src/components/courses/course-grid.tsx
  Profile and memoize motion config objects; ensure no avoidable re-renders in
  hover and first-load sequence. Estimate: S
- [ ] src/hooks/use-media-query.ts
  Validate no hydration mismatch or unnecessary media query recalculation across
  transition-heavy components. Estimate: S
- [ ] src/lib/telemetry/enrollment-events.ts (new)
  Define typed event emitters for enroll lifecycle and dimensions.
  Estimate: M
- [ ] src/providers/app-providers.tsx
  Wire telemetry provider and ensure event emission is non-blocking.
  Estimate: S

### Phase 5 Checklist: Testing, Rollout, and Guardrails

Estimated phase effort: 3 to 5 days

- [ ] src/stores/enrollment.store.ts
  Add unit tests for state transitions and invalid transition guards.
  Estimate: M
- [ ] src/lib/enrollment/enrollment-executor.ts
  Add unit tests for strategy selection, result mapping, and retry behavior.
  Estimate: M
- [ ] src/components/courses/enroll-modal.tsx
  Add integration tests for auth redirect, success, error, and retry paths.
  Estimate: M
- [ ] src/components/courses/latest-course-card.tsx
  Add integration tests for intent metadata and desktop versus mobile behavior.
  Estimate: S
- [ ] src/components/courses/course-grid.tsx
  Add motion-related tests for stagger delay logic and reduced-motion fallback.
  Estimate: S
- [ ] src/app/(platform)/courses/[slug]/page.tsx
  Add E2E coverage for deep-link intent auto-open and callback return flow.
  Estimate: M
- [ ] src/config/env.ts
  Add feature flag definitions for staged rollout and kill switch controls.
  Estimate: S
- [ ] src/config/query-keys.ts
  Ensure post-enrollment invalidation keys are explicit and stable.
  Estimate: S

## Effort Summary by Phase

- Phase 1: 4 to 6 days
- Phase 2: 3 to 5 days
- Phase 3: 4 to 6 days
- Phase 4: 3 to 4 days
- Phase 5: 3 to 5 days

Total estimated effort: 17 to 26 engineering days

## Suggested Team Allocation

- 1 Principal or Senior Frontend Engineer:
  ownership of architecture, state machine, and rollout safeguards.
- 1 Frontend Engineer:
  motion orchestration, modal behavior, and integration testing.
- 1 QA or SDET (partial allocation):
  accessibility validation, E2E reliability, and performance regression checks.

With two engineers in parallel, expected calendar duration is
approximately 2.5 to 4 sprint weeks depending on review bandwidth and backend
dependency readiness.

## Backend Endpoint Checklist (NestJS Integration Pass)

Purpose:

- Make API contracts fully compatible with the enroll click production flow
- Close endpoint and response-shape gaps in one implementation cycle
- Ensure predictable, machine-readable errors and idempotent enrollment writes

Assumptions:

- Backend source is in server/src/courses
- Auth guards continue to provide req.user.id
- Drizzle schema for subscriptions supports unique active enrollment semantics

### Backend Effort Scale

- S: 2 to 4 hours
- M: 0.5 to 1 day
- L: 1 to 2 days
- XL: 2 to 3 days

### Endpoint Readiness Matrix

- [ ] GET /courses
  Make response shape contract-stable and include optional nextAction metadata.
  Status: partial (works, but no typed contract guarantee). Estimate: S
- [ ] GET /courses/:id
  Keep current behavior and ensure contract includes isSubscribed when user is
  authenticated. Status: partial. Estimate: S
- [ ] GET /courses/slug/:slug (new)
  Add true slug-based endpoint to remove front-end compatibility shim.
  Status: missing. Estimate: M
- [ ] GET /courses/:id/subscription-status
  Ensure stable error codes and typed response envelope.
  Status: partial. Estimate: S
- [ ] POST /courses/:id/enroll
  Add idempotency handling, machine-readable error codes, and nextAction output.
  Status: partial. Estimate: L
- [ ] POST /courses/:id/enroll/free (new alias)
  Optional explicit free path for strategy clarity in frontend executor.
  Status: missing. Estimate: M
- [ ] POST /courses/:id/enroll/paid/init (new)
  Initialize paid flow and return checkout client payload.
  Status: missing. Estimate: L
- [ ] POST /courses/:id/enroll/application/init (new)
  Initialize requiresForm flow and return application handoff payload.
  Status: missing. Estimate: M

### Controller Changes Checklist

File: server/src/courses/courses.controller.ts

- [ ] Add GET /courses/slug/:slug route and wire to service.getCourseBySlug.
  Estimate: S
- [ ] Add POST /courses/:id/enroll/free route for explicit strategy endpoint.
  Estimate: S
- [ ] Add POST /courses/:id/enroll/paid/init route.
  Estimate: S
- [ ] Add POST /courses/:id/enroll/application/init route.
  Estimate: S
- [ ] Standardize ParseUUIDPipe usage on id params and Parse slug as string.
  Estimate: S
- [ ] Return consistent response envelope from enroll endpoints:
  success, code, message, data, requestId.
  Estimate: M

### DTO Changes Checklist

File: server/src/courses/dto/create-course.dto.ts

- [ ] Expand category validation to match current frontend categories or add
  clear mapping layer (Engineering, Design, Backend, Systems, Featured,
  ScholarX).
  Estimate: M
- [ ] Add requiresForm boolean to support strategy branching.
  Estimate: S
- [ ] Tighten slug validation format and uniqueness expectations.
  Estimate: S

File: server/src/courses/dto/update-course.dto.ts

- [ ] Ensure requiresForm and category updates are allowed and validated.
  Estimate: S

File: server/src/courses/dto/pagination-query.dto.ts

- [ ] Add slug query support only if needed for backward compatibility.
  Estimate: S
- [ ] Add optional includeInactive flag for admin-only internal tools (guarded).
  Estimate: S

New DTO files:

- [ ] server/src/courses/dto/enroll-free.dto.ts
  Include optional idempotencyKey and sourceSurface metadata.
  Estimate: S
- [ ] server/src/courses/dto/enroll-paid-init.dto.ts
  Include paymentMethod, currency, returnUrl, idempotencyKey.
  Estimate: M
- [ ] server/src/courses/dto/enroll-application-init.dto.ts
  Include applicant profile seed data and idempotencyKey.
  Estimate: M
- [ ] server/src/courses/dto/enrollment-response.dto.ts
  Standard response contract with nextAction and machine-readable code.
  Estimate: M

### Service Changes Checklist

File: server/src/courses/courses.service.ts

- [ ] Add getCourseBySlug(slug, userId?) that resolves active course safely.
  Estimate: M
- [ ] Refactor enrollUserToCourse into strategy-aware internal methods:
  enrollFree, initPaidEnrollment, initApplicationEnrollment.
  Estimate: L
- [ ] Add idempotency support for enrollment writes:
  no double increment of studentsCount on duplicate requests.
  Estimate: L
- [ ] Replace plain text exceptions with structured error codes:
  auth_required, already_enrolled, course_not_found, payment_unavailable,
  validation_failed, unknown.
  Estimate: L
- [ ] Return typed result payload with nextAction for frontend strategy executor.
  Estimate: M
- [ ] Validate blocked user and enrollment eligibility in one shared precheck.
  Estimate: M
- [ ] Ensure transaction safety and deterministic order:
  check existing enrollment before increment, then insert subscription,
  then update counters or derive from aggregate.
  Estimate: L

### Module and Wiring Checklist

File: server/src/courses/courses.module.ts

- [ ] Register any new providers for enrollment strategy services.
  Estimate: S
- [ ] Register payment adapter provider (if paid init route is enabled).
  Estimate: M

Potential new files:

- [ ] server/src/courses/enrollment.service.ts
  Orchestrator for enrollment strategies and response mapping.
  Estimate: L
- [ ] server/src/courses/payment-adapter.service.ts
  Adapter abstraction for payment provider init.
  Estimate: M
- [ ] server/src/courses/enrollment-error.mapper.ts
  Convert domain and infra errors to stable API error codes.
  Estimate: M

### Test Coverage Checklist (Backend)

File: server/src/courses/courses.controller.spec.ts

- [ ] Add route-level tests for new slug and enrollment init endpoints.
  Estimate: M
- [ ] Validate status codes and response envelope shape.
  Estimate: S

File: server/src/courses/courses.service.spec.ts

- [ ] Add service tests for enroll idempotency and duplicate enrollment handling.
  Estimate: M
- [ ] Add tests for blocked user, not found, and validation branches.
  Estimate: M
- [ ] Add tests for paid/application init payloads and code mapping.
  Estimate: M

### Error Contract Checklist

- [ ] Standardize error payload shape across all enroll endpoints:
  error.code, error.message, error.details, requestId.
  Estimate: M
- [ ] Ensure frontend-expected classes map cleanly:
  auth_required, already_enrolled, network_transient,
  validation_failure, payment_unavailable, unknown.
  Estimate: M

### API Completion Definition

Backend is integration-ready when all are true:

- [ ] Frontend can use slug endpoint directly with no compatibility shim.
- [ ] Free, paid-init, and application-init flows have explicit endpoints.
- [ ] Enrollment writes are idempotent and safe under retries.
- [ ] All enrollment errors return stable machine-readable codes.
- [ ] Response envelopes include nextAction and requestId.
- [ ] Controller and service tests cover success, retry, and failure branches.

### Backend Integration Effort Summary

- Controller updates: 1 to 2 days
- DTO updates and additions: 1.5 to 3 days
- Service and orchestration updates: 4 to 7 days
- Test hardening: 2 to 4 days

Total backend effort: 8.5 to 16 engineering days

### Recommended Execution Order

1. DTO and response envelope contracts.
2. Service precheck, idempotency, and strategy refactor.
3. Controller route additions and wiring.
4. Tests for controller and service branches.
5. Frontend switch from shimmed slug flow to native slug endpoint.
