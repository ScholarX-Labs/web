# Tasks: PostHog Analytics Governance

**Input**: Design documents from `/specs/014-posthog-analytics-governance/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include unit, integration, and e2e coverage for critical flows and KPI reconciliation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Next.js app paths under `src/`
- Test paths under `src/**/__tests__/` and `tests/e2e/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize tracking-governance docs and feature flags scaffolding.

- [x] T001 Create analytics governance README in specs/014-posthog-analytics-governance/contracts/README.md
- [x] T002 Add PostHog analytics feature flags in src/lib/executive/feature-flags.ts
- [x] T003 [P] Add analytics env typing for public/server keys in src/config/env.ts
- [x] T004 [P] Add analytics constants module for event names and domains in src/lib/executive/analytics/constants.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core contract/validation/emission infrastructure required by all stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create strict event type definitions and property contracts in src/lib/executive/analytics/types.ts
- [x] T006 Create event schema validators and normalization helpers in src/lib/executive/analytics/schemas.ts
- [x] T007 Implement forbidden-property guard and allowlist sanitizer in src/lib/executive/analytics/privacy.ts
- [ ] T008 Implement fail-open analytics dispatch wrapper in src/lib/executive/analytics/dispatcher.ts
- [ ] T009 [P] Implement idempotency/dedupe utility for mirrored events in src/lib/executive/analytics/dedupe.ts
- [x] T010 Implement client analytics boundary API in src/lib/executive/analytics/client.ts
- [x] T011 Implement server analytics boundary API in src/lib/executive/analytics/server.ts
- [x] T012 Add curated mirror routing rules for KPI-mapped events in src/lib/executive/analytics/mirror-routing.ts
- [x] T013 Implement shared record helper for internal executive analytics writes in src/lib/executive/record-analytics-event.ts
- [x] T014 Add contract unit tests for schemas/privacy guards in src/lib/executive/analytics/__tests__/schemas-privacy.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Growth Tracking Visibility (Priority: P1) 🎯 MVP

**Goal**: Capture reliable public website visits, CTA clicks, and signup funnel progression.

**Independent Test**: Execute homepage -> CTA click -> signup started -> signup completed flow and verify all events with required properties are present.

### Tests for User Story 1

- [ ] T015 [P] [US1] Add unit tests for website/CTA/funnel payload builders in src/lib/executive/analytics/__tests__/growth-events.test.ts
- [ ] T016 [P] [US1] Add integration tests for client analytics wrapper route transitions in src/components/analytics/__tests__/analytics-tracker.test.tsx
- [ ] T017 [US1] Add e2e journey test for growth funnel event capture in tests/e2e/analytics-growth-funnel.spec.ts

### Implementation for User Story 1

- [x] T018 [P] [US1] Implement analytics tracker client component for pageview capture in src/components/analytics/analytics-tracker.tsx
- [x] T019 [US1] Mount analytics tracker in public app layout in src/app/layout.tsx
- [x] T020 [P] [US1] Add reusable CTA tracking hook in src/components/analytics/use-cta-tracking.ts
- [x] T021 [US1] Instrument homepage primary CTAs using tracking hook in src/app/page.tsx
- [x] T022 [US1] Instrument signup start event in src/app/(auth)/sign-up/page.tsx
- [x] T023 [US1] Instrument signup completion event at auth completion boundary in src/lib/auth/auth-events.ts
- [ ] T024 [US1] Ensure all US1 events pass through server-safe mirror helper in src/lib/executive/analytics/growth-events.ts

**Checkpoint**: User Story 1 fully functional and independently testable

---

## Phase 4: User Story 2 - Executive Dashboard Alignment (Priority: P1)

**Goal**: Ensure tracked events reconcile with executive dashboard KPIs and maintain data-gap semantics.

**Independent Test**: Compare selected window counts for visits/clicks/signup/opportunity actions across mirrored store and dashboard responses with <=5% variance.

### Tests for User Story 2

- [x] T025 [P] [US2] Add KPI mapping unit tests for numerator/denominator correctness in src/lib/executive/analytics/__tests__/kpi-mapping.test.ts
- [x] T026 [P] [US2] Add repository integration tests for website analytics snapshot queries in src/domain/executive/infrastructure/db/__tests__/analytics-event-repository.test.ts
- [x] T027 [US2] Add route-level reconciliation assertions for public growth API in src/app/api/admin/executive/__tests__/public-growth-route.test.ts

### Implementation for User Story 2

- [x] T028 [US2] Implement KPI mapping registry used by mirror routing in src/lib/executive/analytics/kpi-mapping.ts
- [x] T029 [US2] Extend mirror writer to include mapped metadata safely in src/lib/executive/record-analytics-event.ts
- [x] T030 [US2] Add true-zero vs data-gap guard logic for website metrics in src/domain/executive/application/executive-dashboard.service.ts
- [x] T031 [US2] Add reconciliation utility for operational checks in src/lib/executive/analytics/reconciliation.ts

**Checkpoint**: User Stories 1 and 2 independently testable with KPI alignment

---

## Phase 5: User Story 3 - Privacy-Safe Analytics Operations (Priority: P1)

**Goal**: Prevent sensitive leakage and guarantee fail-open behavior during analytics outages.

**Independent Test**: Simulate dispatch failure and forbidden-field payloads; verify flow success and safe payload rejection.

### Tests for User Story 3

- [x] T032 [P] [US3] Add unit tests for forbidden fields and allowlist sanitizer in src/lib/executive/analytics/__tests__/privacy-policy.test.ts
- [x] T033 [P] [US3] Add unit tests for fail-open dispatcher behavior in src/lib/executive/analytics/__tests__/dispatcher-failopen.test.ts
- [x] T034 [US3] Add integration test for admin/internal segmentation policy in src/lib/executive/analytics/__tests__/segmentation.test.ts

### Implementation for User Story 3

- [x] T035 [US3] Implement internal/admin segmentation tagging and exclusion rules in src/lib/executive/analytics/segmentation.ts
- [x] T036 [US3] Enforce forbidden-field scrub in all client emission paths in src/lib/executive/analytics/client.ts
- [x] T037 [US3] Enforce forbidden-field scrub in all server emission paths in src/lib/executive/analytics/server.ts
- [x] T038 [US3] Add structured warning logs for dropped analytics payloads in src/lib/executive/analytics/dispatcher.ts

**Checkpoint**: Privacy and fail-open guarantees validated independently

---

## Phase 6: User Story 4 - Product and Opportunity Behavior Insight (Priority: P2)

**Goal**: Track search/AI and opportunity behavior signals with safe, analyzable properties.

**Independent Test**: Execute search + opportunity journeys and validate event coverage for view/save/apply and zero-result trends.

### Tests for User Story 4

- [x] T039 [P] [US4] Add unit tests for search/opportunity event property bucketization in src/lib/executive/analytics/__tests__/search-opportunity-events.test.ts
- [x] T040 [P] [US4] Add integration tests for AI/opportunity mirror eligibility in src/lib/executive/analytics/__tests__/mirror-routing.test.ts
- [x] T041 [US4] Add e2e smoke test for opportunity apply + search events in tests/e2e/analytics-opportunity-search.spec.ts

### Implementation for User Story 4

- [x] T042 [US4] Instrument opportunity view/save/apply events in src/lib/opportunities/opportunity-analytics.ts
- [x] T043 [US4] Integrate opportunity analytics calls in src/app/opportunities/page.tsx
- [x] T044 [US4] Instrument AI/search events with safe buckets in src/lib/ai/ai-search-analytics.ts
- [x] T045 [US4] Integrate AI/search instrumentation in src/app/api/ai/search/route.ts

**Checkpoint**: Opportunity/search insights independently functional

---

## Phase 7: User Story 5 - Tracking Governance and Change Control (Priority: P2)

**Goal**: Establish stable ownership, lifecycle controls, and release-time validation for event contracts.

**Independent Test**: Add a new event via governance process and verify required documentation, owner assignment, and validation checks pass.

### Tests for User Story 5

- [x] T046 [P] [US5] Add unit tests for event dictionary registry integrity in src/lib/executive/analytics/__tests__/event-registry.test.ts
- [x] T047 [US5] Add CI validation test for required event contract metadata in src/lib/executive/analytics/__tests__/contract-completeness.test.ts

### Implementation for User Story 5

- [x] T048 [US5] Add canonical event registry source-of-truth in src/lib/executive/analytics/event-registry.ts
- [x] T049 [US5] Add governance change-log template in specs/014-posthog-analytics-governance/contracts/change-log-template.md
- [x] T050 [US5] Add release checklist for analytics contract updates in specs/014-posthog-analytics-governance/contracts/release-checklist.md
- [x] T051 [US5] Add dev-facing tracking playbook in docs/analytics/posthog-governance.md

**Checkpoint**: Governance and change control operational

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation, and validation across stories.

- [x] T052 [P] Add end-to-end quickstart validation notes in specs/014-posthog-analytics-governance/quickstart.md
- [x] T053 Add performance review for client tracking overhead in src/components/analytics/analytics-tracker.tsx
- [x] T054 [P] Add observability counters for delivery success/completeness in src/lib/executive/analytics/telemetry.ts
- [x] T055 Run full regression test suite and document outcomes in specs/014-posthog-analytics-governance/validation-report.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - starts immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - blocks all user stories
- **Phases 3-7 (User Stories)**: Depend on Phase 2
  - P1 stories (US1, US2, US3) first
  - P2 stories (US4, US5) after P1 baseline
- **Phase 8 (Polish)**: Depends on completion of targeted stories

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on other stories
- **US2 (P1)**: Depends on US1 event emission baseline
- **US3 (P1)**: Depends on foundational dispatcher/privacy layers; can proceed alongside US2
- **US4 (P2)**: Depends on US1+US3 instrumentation boundaries
- **US5 (P2)**: Depends on established contracts from Phase 2 and events introduced in US1-US4

### Parallel Opportunities

- Setup parallel: T003, T004
- Foundational parallel: T009
- US1 parallel: T015, T016, T018, T020
- US2 parallel: T025, T026
- US3 parallel: T032, T033
- US4 parallel: T039, T040
- US5 parallel: T046
- Polish parallel: T052, T054

---

## Parallel Example: User Story 1

```bash
Task: "Add unit tests for website/CTA/funnel payload builders in src/lib/executive/analytics/__tests__/growth-events.test.ts"
Task: "Add integration tests for client analytics wrapper route transitions in src/components/analytics/__tests__/analytics-tracker.test.tsx"
Task: "Implement analytics tracker client component for pageview capture in src/components/analytics/analytics-tracker.tsx"
Task: "Add reusable CTA tracking hook in src/components/analytics/use-cta-tracking.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phase 1 + Phase 2
2. Complete US1 (Phase 3)
3. Validate end-to-end funnel capture and required properties
4. Ship behind feature flag

### Incremental Delivery

1. Foundation complete
2. Ship US1 (growth visibility)
3. Add US2 + US3 (alignment + privacy/fail-open)
4. Add US4 (product/opportunity insight)
5. Add US5 (governance controls)
6. Final polish and broad regression

### Parallel Team Strategy

1. Team A: Foundation + privacy boundary
2. Team B: US1 public tracking
3. Team C: US2 reconciliation + dashboard semantics
4. Team D: US4 opportunity/search after boundary stabilization
5. Shared owner: US5 governance artifacts and CI checks

---

## Notes

- [P] tasks target different files and can run concurrently.
- Keep route handlers thin and delegate business rules to `src/lib/executive/analytics/*`.
- Enforce strict typing and forbidden-field checks before every analytics dispatch.
- Preserve public/auth/admin separation for all instrumentation.
