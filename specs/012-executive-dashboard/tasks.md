# Tasks: Executive Dashboard Analytics

**Input**: Design documents from `specs/012-executive-dashboard/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included. The project constitution, feature spec, and implementation plan require unit, route contract, integration, accessibility, and Playwright coverage for core logic and critical user paths.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently after the shared foundation is complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks.
- **[Story]**: User story label from `spec.md`.
- Every task includes an exact file path.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the executive feature workspace, contracts, and feature flags without changing existing admin CRUD behavior.

- [X] T001 Create executive domain folder structure in `src/domain/executive/`
- [X] T002 Create executive component folder structure in `src/components/executive/`
- [X] T003 Create executive route folder structure in `src/app/admin/executive/`
- [X] T004 Create executive API route folder structure in `src/app/api/admin/executive/`
- [X] T005 Create executive hooks folder structure in `src/hooks/executive/`
- [X] T006 Create executive client library folder structure in `src/lib/executive/`
- [X] T007 [P] Add typed feature flag resolver in `src/lib/executive/feature-flags.ts`
- [X] T008 [P] Add executive query key factory in `src/lib/executive/executive-query-keys.ts`
- [X] T009 [P] Add metric/page/section id constants in `src/domain/executive/contracts/executive-types.ts`
- [X] T010 [P] Add executive route path constants in `src/lib/executive/executive-routes.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build schema, contracts, policies, repositories, and shared UI primitives required by all user stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T011 Define executive query and pagination schemas in `src/domain/executive/contracts/executive-query.schemas.ts`
- [X] T012 Define executive read repository contract in `src/domain/executive/contracts/executive-read-repository.contract.ts`
- [X] T013 Define Action Center repository contract in `src/domain/executive/contracts/action-center-repository.contract.ts`
- [X] T014 Define export renderer contract in `src/domain/executive/contracts/export-renderer.contract.ts`
- [X] T015 Define executive analytics tables in `src/db/schema/executive-analytics.schema.ts`
- [X] T016 Add analytics event migration in `drizzle/0016_executive_analytics_events.sql`
- [X] T017 Add Action Center state migration with `rule_id`, `severity`, `dismissed_at`, `resolved_at`, and `reopened_count` in `drizzle/0017_executive_action_item_states.sql`
- [X] T018 Add metric freshness migration with `last_query_duration_ms` and `rolling_p95_duration_ms` in `drizzle/0018_executive_metric_freshness.sql`
- [X] T019 Add public impact metric governance migration with canonical states in `drizzle/0019_executive_public_impact_metrics.sql`
- [X] T020 Add production index migration using `created_at` and `session_id_hash` in `drizzle/0020_executive_indexes.sql`
- [X] T021 Implement executive access policy with Phase 1 admin-only behavior in `src/domain/executive/application/executive-access.policy.ts`
- [X] T022 Implement metric definition registry in `src/domain/executive/application/metric-definition.registry.ts`
- [X] T023 Implement metric calculation policy in `src/domain/executive/application/metric-calculation.policy.ts`
- [X] T024 Implement redaction policy for overview, drilldown, and exports in `src/domain/executive/application/redaction.policy.ts`
- [X] T025 Implement freshness service with section latency recording in `src/domain/executive/application/freshness.service.ts`
- [X] T026 Implement chart series mapper in `src/domain/executive/application/chart-series.mapper.ts`
- [X] T027 Implement Drizzle executive read repository shell in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T028 Implement Action Center workflow repository shell in `src/domain/executive/infrastructure/db/action-center.repository.ts`
- [X] T029 Implement analytics event repository shell in `src/domain/executive/infrastructure/db/analytics-event.repository.ts`
- [X] T030 Implement executive domain factory in `src/domain/executive/factory/executive-domain.factory.ts`
- [X] T031 Add executive domain barrel exports in `src/domain/executive/index.ts`
- [X] T032 [P] Add metric card primitive in `src/components/executive/sections/metric-card.tsx`
- [X] T033 [P] Add freshness badge primitive in `src/components/executive/sections/freshness-badge.tsx`
- [X] T034 [P] Add section state primitive in `src/components/executive/sections/section-state.tsx`
- [X] T035 [P] Add chart accessibility summary primitive in `src/components/executive/charts/chart-a11y-summary.tsx`
- [X] T036 Add executive API client in `src/lib/executive/executive-api-client.ts`
- [X] T037 Add executive layout with admin guard and feature flag guard in `src/app/admin/executive/layout.tsx`
- [X] T038 Add catch-all executive API route dispatcher in `src/app/api/admin/executive/[[...path]]/route.ts`
- [X] T039 Add foundation unit tests for query schemas, RBAC, calculations, redaction, and freshness in `src/domain/executive/__tests__/executive-foundation.test.ts`
- [X] T040 Add foundation route contract tests for 401, 403, 404 flag disabled, 422 validation, and 429 rate limiting in `src/app/api/admin/executive/__tests__/executive-route-contract.test.ts`

**Checkpoint**: Foundation ready. User story implementation can begin.

---

## Phase 3: User Story 1 - CEO Reviews Business Health (Priority: P1) MVP

**Goal**: Deliver the Overview page with business-health KPIs, trend charts, risk indicators, freshness, and consistent date/filter behavior.

**Independent Test**: Sign in as an authorized admin, open `/admin/executive`, and confirm headline metrics, trend charts, top drivers, risk indicators, and freshness are visible without navigating away.

### Tests for User Story 1

- [X] T041 [P] [US1] Add overview calculation unit tests in `src/domain/executive/__tests__/overview-calculations.test.ts`
- [X] T042 [P] [US1] Add overview route contract tests in `src/app/api/admin/executive/__tests__/overview-route.test.ts`
- [X] T043 [P] [US1] Add overview Playwright test in `tests/e2e/executive-overview.spec.ts`

### Implementation for User Story 1

- [X] T044 [US1] Implement overview repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T045 [US1] Implement overview read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T046 [P] [US1] Add revenue and completion chart primitives in `src/components/executive/charts/area-chart.tsx`
- [X] T047 [P] [US1] Add funnel chart primitive in `src/components/executive/charts/funnel-chart.tsx`
- [X] T048 [US1] Build Overview page in `src/app/admin/executive/page.tsx`
- [X] T049 [US1] Add Overview route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Growth Analyst Reviews User Activity and Peak Times (Priority: P1)

**Goal**: Deliver user counters, growth trends, role distribution, 24x7 activity heatmap, peak summaries, and role filtering.

**Independent Test**: Open `/admin/executive/users` with a seeded 30-day range and verify counts, heatmap, peak hour/day/month, and role-filtered recalculation.

### Tests for User Story 2

- [X] T050 [P] [US2] Add heatmap bucketing unit tests in `src/domain/executive/__tests__/heatmap-buckets.test.ts`
- [X] T051 [P] [US2] Add users route contract tests in `src/app/api/admin/executive/__tests__/users-route.test.ts`
- [X] T052 [P] [US2] Add users Playwright test in `tests/e2e/executive-users.spec.ts`

### Implementation for User Story 2

- [X] T053 [US2] Implement users and activity repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T054 [US2] Implement users read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T055 [P] [US2] Add heatmap chart primitive in `src/components/executive/charts/heatmap.tsx`
- [X] T056 [P] [US2] Add bar chart primitive in `src/components/executive/charts/bar-chart.tsx`
- [X] T057 [US2] Build Users page in `src/app/admin/executive/users/page.tsx`
- [X] T058 [US2] Add Users route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - CTO Reviews Platform and Operational Health (Priority: P1)

**Goal**: Deliver Technical Health with freshness grid, pipeline health, audit log, platform usage, security signals, email health, and query latency.

**Independent Test**: Seed healthy and stale sections, open `/admin/executive/technical-health`, and verify freshness states, pipeline overdue flags, audit entries, and data-gap distinction.

### Tests for User Story 3

- [X] T059 [P] [US3] Add freshness and latency unit tests in `src/domain/executive/__tests__/freshness-service.test.ts`
- [X] T060 [P] [US3] Add technical health route contract tests in `src/app/api/admin/executive/__tests__/technical-health-route.test.ts`
- [X] T061 [P] [US3] Add technical health Playwright test in `tests/e2e/executive-technical-health.spec.ts`

### Implementation for User Story 3

- [X] T062 [US3] Implement technical health repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T063 [US3] Implement technical health read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T064 [P] [US3] Add freshness grid component in `src/components/executive/sections/freshness-grid.tsx`
- [X] T065 [P] [US3] Add admin audit table component in `src/components/executive/tables/admin-audit-table.tsx`
- [X] T066 [US3] Build Technical Health page in `src/app/admin/executive/technical-health/page.tsx`
- [X] T067 [US3] Add Technical Health route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: User Story 4 - Product Lead Inspects Per-Course and Per-Lesson Analytics (Priority: P1)

**Goal**: Deliver course leaderboard, category distribution, course management links, lesson drilldown, completion funnel, and critical-drop flags.

**Independent Test**: Open `/admin/executive/courses-lessons`, drill into a seeded course, and verify sorted lesson analytics and exact critical-drop detection.

### Tests for User Story 4

- [X] T068 [P] [US4] Add lesson funnel and critical-drop unit tests in `src/domain/executive/__tests__/lesson-analytics.test.ts`
- [X] T069 [P] [US4] Add courses and lesson drilldown route tests in `src/app/api/admin/executive/__tests__/courses-lessons-route.test.ts`
- [X] T070 [P] [US4] Add courses and lessons Playwright test in `tests/e2e/executive-courses-lessons.spec.ts`

### Implementation for User Story 4

- [X] T071 [US4] Implement course and lesson repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T072 [US4] Implement courses and lesson drilldown read models in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T073 [P] [US4] Add course leaderboard table in `src/components/executive/tables/course-leaderboard-table.tsx`
- [X] T074 [P] [US4] Add lesson analytics table in `src/components/executive/tables/lesson-analytics-table.tsx`
- [X] T075 [US4] Build Courses & Lessons page in `src/app/admin/executive/courses-lessons/page.tsx`
- [X] T076 [US4] Add Courses & Lessons route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 4 is independently functional and testable.

---

## Phase 7: User Story 8 - Operations Lead Uses Action Center (Priority: P1)

**Goal**: Deliver a prioritized operational queue with severity, ownership, status transitions, audit logging, and reopening behavior.

**Independent Test**: Seed stalled learners, an overdue inquiry, and a failed email delivery, then verify all appear with correct severity and can be updated with audit logging.

### Tests for User Story 8

- [X] T077 [P] [US8] Add Action Center rule and reopening unit tests in `src/domain/executive/__tests__/action-center-rules.test.ts`
- [X] T078 [P] [US8] Add Action Center route contract tests in `src/app/api/admin/executive/__tests__/action-center-route.test.ts`
- [X] T079 [P] [US8] Add Action Center Playwright test in `tests/e2e/executive-action-center.spec.ts`

### Implementation for User Story 8

- [X] T080 [US8] Implement Action Center rule strategies in `src/domain/executive/application/action-center-rules.ts`
- [X] T081 [US8] Implement Action Center service merge and sorting logic in `src/domain/executive/application/action-center.service.ts`
- [X] T082 [US8] Implement Action Center repository persistence in `src/domain/executive/infrastructure/db/action-center.repository.ts`
- [X] T083 [P] [US8] Add action items table in `src/components/executive/tables/action-items-table.tsx`
- [X] T084 [US8] Build Action Center page in `src/app/admin/executive/action-center/page.tsx`
- [X] T085 [US8] Add Action Center GET and PATCH route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 8 is independently functional and testable.

---

## Phase 8: User Story 9 - Growth Lead Diagnoses Funnel Drop-Off (Priority: P1)

**Goal**: Deliver learner journey funnel analytics from visitor/signup through enrollment, completion, and opportunity action.

**Independent Test**: Walk through a seeded visitor-to-signup-to-enrollment flow and verify every funnel step count and drop-off percentage.

### Tests for User Story 9

- [X] T086 [P] [US9] Add growth funnel calculation tests in `src/domain/executive/__tests__/growth-funnel.test.ts`
- [X] T087 [P] [US9] Add public growth route contract tests in `src/app/api/admin/executive/__tests__/public-growth-route.test.ts`
- [X] T088 [P] [US9] Add growth funnel Playwright test in `tests/e2e/executive-public-growth.spec.ts`

### Implementation for User Story 9

- [X] T089 [US9] Implement growth funnel repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T090 [US9] Implement public growth read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T091 [P] [US9] Add growth funnel component in `src/components/executive/sections/growth-funnel.tsx`
- [X] T092 [US9] Build Public Website & Growth page shell in `src/app/admin/executive/public-growth/page.tsx`
- [X] T093 [US9] Add Public Growth route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 9 is independently functional and testable.

---

## Phase 9: User Story 10 - Opportunity Manager Maintains Opportunity Quality (Priority: P1)

**Goal**: Deliver expired opportunity, broken link, missing metadata, high-save/low-apply, and cleanup queue signals.

**Independent Test**: Seed a broken and expired opportunity and verify it appears in Opportunities & AI and Action Center queues with correct severity.

### Tests for User Story 10

- [X] T094 [P] [US10] Add opportunity quality rule tests in `src/domain/executive/__tests__/opportunity-quality.test.ts`
- [X] T095 [P] [US10] Add opportunity quality route contract tests in `src/app/api/admin/executive/__tests__/opportunities-ai-route.test.ts`
- [X] T096 [P] [US10] Add opportunity quality Playwright test in `tests/e2e/executive-opportunity-quality.spec.ts`

### Implementation for User Story 10

- [X] T097 [US10] Implement opportunity quality repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T098 [US10] Implement opportunity quality read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T099 [P] [US10] Add opportunity cleanup queue table in `src/components/executive/tables/opportunity-cleanup-table.tsx`
- [X] T100 [US10] Extend Opportunities & AI page with quality queues in `src/app/admin/executive/opportunities-ai/page.tsx`
- [X] T101 [US10] Extend Action Center rules for opportunity quality in `src/domain/executive/application/action-center-rules.ts`

**Checkpoint**: User Story 10 is independently functional and testable.

---

## Phase 10: User Story 11 - Sales Lead Manages Inquiry Pipeline (Priority: P1)

**Goal**: Deliver inquiry pipeline analytics, SLA breach detection, owner workload, follow-up status, and Action Center integration.

**Independent Test**: Seed an uncontacted inquiry older than the SLA and verify it appears as High severity in Action Center and pipeline sections.

### Tests for User Story 11

- [X] T102 [P] [US11] Add inquiry SLA rule tests in `src/domain/executive/__tests__/inquiry-pipeline.test.ts`
- [X] T103 [P] [US11] Add inquiry pipeline route tests in `src/app/api/admin/executive/__tests__/inquiry-pipeline-route.test.ts`
- [X] T104 [P] [US11] Add inquiry pipeline Playwright test in `tests/e2e/executive-inquiry-pipeline.spec.ts`

### Implementation for User Story 11

- [X] T105 [US11] Implement inquiry pipeline repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T106 [US11] Implement inquiry pipeline read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T107 [P] [US11] Add sales pipeline table in `src/components/executive/tables/sales-pipeline-table.tsx`
- [X] T108 [US11] Extend Action Center page with Sales & Support section in `src/app/admin/executive/action-center/page.tsx`
- [X] T109 [US11] Extend Action Center rules for inquiry SLA breaches in `src/domain/executive/application/action-center-rules.ts`

**Checkpoint**: User Story 11 is independently functional and testable.

---

## Phase 11: User Story 15 - Growth Manager Reviews V2 Website Performance (Priority: P1)

**Goal**: Deliver V2 website CTA, traffic source, device, campaign, and signup conversion analytics with data-gap states when instrumentation is absent.

**Independent Test**: Simulate homepage to CTA to signup events and verify the Public Growth website funnel shows expected counts or a data-gap state when events are absent.

### Tests for User Story 15

- [X] T110 [P] [US15] Add website analytics data-gap tests in `src/domain/executive/__tests__/website-analytics.test.ts`
- [X] T111 [P] [US15] Add website analytics route tests in `src/app/api/admin/executive/__tests__/website-analytics-route.test.ts`
- [X] T112 [P] [US15] Add website analytics Playwright test in `tests/e2e/executive-website-analytics.spec.ts`

### Implementation for User Story 15

- [X] T113 [US15] Implement website analytics event queries in `src/domain/executive/infrastructure/db/analytics-event.repository.ts`
- [X] T114 [US15] Implement website analytics read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T115 [P] [US15] Add website funnel component in `src/components/executive/sections/website-funnel.tsx`
- [X] T116 [US15] Extend Public Website & Growth page with website analytics in `src/app/admin/executive/public-growth/page.tsx`
- [X] T117 [US15] Add website analytics route response sections in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 15 is independently functional and testable.

---

## Phase 12: User Story 16 - Leadership Reviews Public Impact Metrics Governance (Priority: P1)

**Goal**: Deliver public impact metric governance with source, owner, freshness, approval state, manual override, and audit trail.

**Independent Test**: Open Public Impact Metrics and verify every metric shows source, owner, freshness, approval status, and manual override audit details.

### Tests for User Story 16

- [X] T118 [P] [US16] Add public impact state-machine unit tests in `src/domain/executive/__tests__/public-impact-governance.test.ts`
- [X] T119 [P] [US16] Add public impact governance route tests in `src/app/api/admin/executive/__tests__/public-impact-governance-route.test.ts`
- [X] T120 [P] [US16] Add public impact Playwright test in `tests/e2e/executive-public-impact.spec.ts`

### Implementation for User Story 16

- [X] T121 [US16] Implement public impact governance repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T122 [US16] Implement public impact governance service logic in `src/domain/executive/application/public-impact-governance.service.ts`
- [X] T123 [P] [US16] Add public impact metrics table in `src/components/executive/tables/public-impact-metrics-table.tsx`
- [X] T124 [US16] Extend Public Website & Growth page with public impact governance in `src/app/admin/executive/public-growth/page.tsx`
- [X] T125 [US16] Add public impact governance routes in `src/app/api/admin/executive/public-growth/metrics/route.ts`
- [X] T126 [US16] Add public impact approve and reject routes in `src/app/api/admin/executive/public-growth/metrics/[id]/route.ts`

**Checkpoint**: User Story 16 is independently functional and testable.

---

## Phase 13: User Story 5 - Product Lead Reviews Opportunity Discovery and AI Search Usage (Priority: P2)

**Goal**: Deliver AI usage, query trends, zero-result rate, quality analytics, latency, error rate, estimated cost, and true-zero handling.

**Independent Test**: Open Opportunities & AI with seeded AI events and verify query counts, zero-result rate, quality flags, and true-zero state for empty ranges.

### Tests for User Story 5

- [X] T127 [P] [US5] Add AI search quality calculation tests in `src/domain/executive/__tests__/ai-search-quality.test.ts`
- [X] T128 [P] [US5] Add AI search route contract tests in `src/app/api/admin/executive/__tests__/ai-search-route.test.ts`
- [X] T129 [P] [US5] Add AI search Playwright test in `tests/e2e/executive-ai-search.spec.ts`

### Implementation for User Story 5

- [X] T130 [US5] Implement AI search analytics queries in `src/domain/executive/infrastructure/db/analytics-event.repository.ts`
- [X] T131 [US5] Implement Opportunities & AI read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T132 [P] [US5] Add per-user AI usage table in `src/components/executive/tables/ai-usage-table.tsx`
- [X] T133 [P] [US5] Add AI quality section component in `src/components/executive/sections/ai-quality-section.tsx`
- [X] T134 [US5] Build Opportunities & AI page base sections in `src/app/admin/executive/opportunities-ai/page.tsx`
- [X] T135 [US5] Add Opportunities & AI route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 5 is independently functional and testable.

---

## Phase 14: User Story 6 - Admin Reviews Comprehensive User and Course Management (Priority: P2)

**Goal**: Deliver dashboard-level oversight tables for users and courses without replacing operational admin edit pages.

**Independent Test**: Open user and course management sections and verify searchable, paginated, role-safe oversight data with links to existing admin edit pages.

### Tests for User Story 6

- [X] T136 [P] [US6] Add management table query tests in `src/domain/executive/__tests__/management-tables.test.ts`
- [X] T137 [P] [US6] Add management table route tests in `src/app/api/admin/executive/__tests__/management-tables-route.test.ts`
- [X] T138 [P] [US6] Add management table Playwright test in `tests/e2e/executive-management-tables.spec.ts`

### Implementation for User Story 6

- [X] T139 [US6] Implement user and course management repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T140 [US6] Implement management table read models in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T141 [P] [US6] Add user management table in `src/components/executive/tables/user-management-table.tsx`
- [X] T142 [P] [US6] Add course management table in `src/components/executive/tables/course-management-table.tsx`
- [X] T143 [US6] Extend Users page with management table in `src/app/admin/executive/users/page.tsx`
- [X] T144 [US6] Extend Courses & Lessons page with management table in `src/app/admin/executive/courses-lessons/page.tsx`

**Checkpoint**: User Story 6 is independently functional and testable.

---

## Phase 15: User Story 12 - Community Lead Measures Event Impact (Priority: P2)

**Goal**: Deliver event registration, attendance data-gap, no-show, and post-event conversion analytics.

**Independent Test**: Open the Events section for a known event ID and verify registration counts and data-gap attendance behavior.

### Tests for User Story 12

- [X] T145 [P] [US12] Add event impact calculation tests in `src/domain/executive/__tests__/event-impact.test.ts`
- [X] T146 [P] [US12] Add event impact route tests in `src/app/api/admin/executive/__tests__/event-impact-route.test.ts`
- [X] T147 [P] [US12] Add event impact Playwright test in `tests/e2e/executive-event-impact.spec.ts`

### Implementation for User Story 12

- [X] T148 [US12] Implement event registration queries from `auth.user.registeredEvents` in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T149 [US12] Implement event impact read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T150 [P] [US12] Add event impact table in `src/components/executive/tables/event-impact-table.tsx`
- [X] T151 [US12] Extend Opportunities & AI page with registered events section in `src/app/admin/executive/opportunities-ai/page.tsx`
- [X] T152 [US12] Add registered events response section in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 12 is independently functional and testable.

---

## Phase 16: User Story 13 - Content Lead Identifies Courses Needing Improvement (Priority: P2)

**Goal**: Deliver content quality indicators for missing thumbnails, no owner, stale lessons, draft lessons, high enrollment/low completion, and critical drop combinations.

**Independent Test**: Seed a problematic course and verify the Courses & Lessons page shows all content-quality badges without layout crowding.

### Tests for User Story 13

- [X] T153 [P] [US13] Add content quality rule tests in `src/domain/executive/__tests__/content-quality.test.ts`
- [X] T154 [P] [US13] Add content quality route tests in `src/app/api/admin/executive/__tests__/content-quality-route.test.ts`
- [X] T155 [P] [US13] Add content quality Playwright test in `tests/e2e/executive-content-quality.spec.ts`

### Implementation for User Story 13

- [X] T156 [US13] Implement content quality repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T157 [US13] Implement content quality read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T158 [P] [US13] Add content quality checklist component in `src/components/executive/sections/content-quality-checklist.tsx`
- [X] T159 [US13] Extend Courses & Lessons page with content quality indicators in `src/app/admin/executive/courses-lessons/page.tsx`
- [X] T160 [US13] Extend Action Center rules for course health alerts in `src/domain/executive/application/action-center-rules.ts`

**Checkpoint**: User Story 13 is independently functional and testable.

---

## Phase 17: User Story 14 - CEO Reviews Unit Economics (Priority: P2)

**Goal**: Deliver Finance & Unit Economics with revenue, net revenue, refunds, ARPU, paid/manual split, and course-level business performance.

**Independent Test**: Select a known course and verify gross revenue, net revenue, enrollment, completion, refund rate, and support workload match fixtures.

### Tests for User Story 14

- [X] T161 [P] [US14] Add finance calculation tests in `src/domain/executive/__tests__/finance-unit-economics.test.ts`
- [X] T162 [P] [US14] Add finance route contract tests in `src/app/api/admin/executive/__tests__/finance-route.test.ts`
- [X] T163 [P] [US14] Add finance Playwright test in `tests/e2e/executive-finance.spec.ts`

### Implementation for User Story 14

- [X] T164 [US14] Implement finance repository queries in `src/domain/executive/infrastructure/db/executive.repository.ts`
- [X] T165 [US14] Implement finance read model in `src/domain/executive/application/executive-dashboard.service.ts`
- [X] T166 [P] [US14] Add course business performance table in `src/components/executive/tables/course-business-performance-table.tsx`
- [X] T167 [US14] Build Finance & Unit Economics page in `src/app/admin/executive/finance/page.tsx`
- [X] T168 [US14] Add Phase 2-gated Finance route handling in `src/app/api/admin/executive/[[...path]]/route.ts`

**Checkpoint**: User Story 14 is independently functional and testable behind the Phase 2 flag.

---

## Phase 18: User Story 7 - Executive Exports Board-Ready Snapshots from Any Page (Priority: P3)

**Goal**: Deliver CSV and print/PDF-ready snapshot exports with matching metrics, freshness notes, redaction notes, audit logs, rate limiting, and overflow rejection.

**Independent Test**: Export a filtered Overview snapshot and verify selected range, filters, visible metrics, chart data tables, freshness notes, and audit entry.

### Tests for User Story 7

- [X] T169 [P] [US7] Add export payload and redaction tests in `src/domain/executive/__tests__/executive-export.test.ts`
- [X] T170 [P] [US7] Add export route contract tests in `src/app/api/admin/executive/__tests__/export-route.test.ts`
- [X] T171 [P] [US7] Add export Playwright test in `tests/e2e/executive-export.spec.ts`

### Implementation for User Story 7

- [X] T172 [US7] Implement executive export service in `src/domain/executive/application/executive-export.service.ts`
- [X] T173 [P] [US7] Implement CSV export utilities in `src/lib/executive/csv-export.ts`
- [X] T174 [P] [US7] Implement snapshot export renderer in `src/lib/executive/snapshot-export.tsx`
- [X] T175 [P] [US7] Add export button component in `src/components/executive/sections/export-button.tsx`
- [X] T176 [US7] Add export API route in `src/app/api/admin/executive/export/route.ts`
- [X] T177 [US7] Wire export button into all active executive pages in `src/components/executive/sections/export-button.tsx`

**Checkpoint**: User Story 7 is independently functional and testable.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Complete shared quality gates, documentation, accessibility, responsiveness, and operational validation.

- [X] T178 [P] Add shared fixture data for executive tests in `src/domain/executive/__tests__/fixtures/executive-fixtures.ts`
- [X] T179 [P] Add fixture seed and teardown helpers in `src/domain/executive/__tests__/helpers/seed-executive-fixtures.ts`
- [X] T180 Add executive admin sidebar entry without changing CRUD routes in `src/app/admin/_components/admin-sidebar.tsx`
- [X] T181 Add global date range selector in `src/components/executive/filters/date-range-selector.tsx`
- [X] T182 Add active filter bar in `src/components/executive/filters/active-filter-bar.tsx`
- [X] T183 Add executive filter provider with navigation persistence in `src/components/executive/filters/executive-filter-provider.tsx`
- [X] T184 Add React Query hook for page reads in `src/hooks/executive/use-executive-page.ts`
- [X] T185 Add React Query hook for Action Center updates in `src/hooks/executive/use-action-center.ts`
- [X] T186 Add React Query hook for exports in `src/hooks/executive/use-executive-export.ts`
- [X] T187 Add accessibility tests for keyboard navigation and chart summaries in `tests/e2e/executive-accessibility.spec.ts`
- [X] T188 Add responsive screenshot checks for 1280px, 768px, and 375px in `tests/e2e/executive-responsive.spec.ts`
- [X] T189 Add quickstart validation notes after implementation in `specs/012-executive-dashboard/quickstart.md`
- [X] T190 Run focused test command for executive unit and route tests using `package.json`
- [X] T191 Run Playwright executive suite using `tests/e2e/executive-overview.spec.ts`
- [X] T192 Run type check and lint validation using `package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks every user story.
- **P1 Stories**: US1, US2, US3, US4, US8, US9, US10, US11, US15, and US16 can start after Foundation.
- **P2 Stories**: US5, US6, US12, US13, and US14 can start after Foundation; US14 remains Phase 2-gated.
- **P3 Stories**: US7 can start after Foundation but is safest after at least US1 and one table-heavy page exist.
- **Polish**: Depends on the desired story set being complete.

### User Story Dependencies

- **US1 Overview**: No story dependency after Foundation. Suggested MVP.
- **US2 Users**: No story dependency after Foundation.
- **US3 Technical Health**: No story dependency after Foundation.
- **US4 Courses & Lessons**: No story dependency after Foundation.
- **US8 Action Center**: Depends on Foundation; value increases as US3, US4, US10, US11, US13 add signals.
- **US9 Public Growth Funnel**: No story dependency after Foundation.
- **US10 Opportunity Quality**: Depends on Action Center rule infrastructure from US8 for cross-page surfacing.
- **US11 Inquiry Pipeline**: Depends on Action Center rule infrastructure from US8 for SLA surfacing.
- **US15 Website Analytics**: Shares Public Growth page with US9.
- **US16 Public Impact Governance**: Shares Public Growth page with US9.
- **US5 AI Search Analytics**: Shares Opportunities & AI page with US10.
- **US6 Management Oversight**: Extends Users and Courses & Lessons pages.
- **US12 Event Impact**: Shares Opportunities & AI page with US5 and US10.
- **US13 Content Quality**: Extends Courses & Lessons and Action Center.
- **US14 Finance**: Phase 2-gated; no Phase 1 release dependency.
- **US7 Exports**: Reuses all page read services; safest after core page DTOs are stable.

### Parallel Opportunities

- Setup tasks T007-T010 can run in parallel.
- Shared UI primitive tasks T032-T035 can run in parallel.
- Test tasks at the start of each story can run in parallel with each other.
- Different pages can be implemented in parallel after T011-T040 are complete.
- US2, US3, US4, US8, US9, US15, and US16 can be staffed independently after Foundation, with merge coordination for shared service and route files.

---

## Parallel Execution Examples

### User Story 1

```text
Task: "T041 Add overview calculation unit tests in src/domain/executive/__tests__/overview-calculations.test.ts"
Task: "T042 Add overview route contract tests in src/app/api/admin/executive/__tests__/overview-route.test.ts"
Task: "T043 Add overview Playwright test in tests/e2e/executive-overview.spec.ts"
```

### User Story 8

```text
Task: "T077 Add Action Center rule and reopening unit tests in src/domain/executive/__tests__/action-center-rules.test.ts"
Task: "T078 Add Action Center route contract tests in src/app/api/admin/executive/__tests__/action-center-route.test.ts"
Task: "T079 Add Action Center Playwright test in tests/e2e/executive-action-center.spec.ts"
```

### User Story 16

```text
Task: "T118 Add public impact state-machine unit tests in src/domain/executive/__tests__/public-impact-governance.test.ts"
Task: "T119 Add public impact governance route tests in src/app/api/admin/executive/__tests__/public-impact-governance-route.test.ts"
Task: "T120 Add public impact Playwright test in tests/e2e/executive-public-impact.spec.ts"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundation.
3. Complete US1 Overview.
4. Validate Overview independently with unit, route, and Playwright checks.
5. Demo the executive shell and Overview before adding more pages.

### Operational Phase 1

1. Add US2 Users, US3 Technical Health, US4 Courses & Lessons, and US8 Action Center.
2. Add US9 Public Growth, US10 Opportunity Quality, US11 Inquiry Pipeline, US15 Website Analytics, and US16 Public Impact Governance.
3. Run cross-page RBAC, redaction, freshness, data-gap, and responsive checks.

### Incremental Expansion

1. Add P2 analytical depth: US5 AI Search, US6 Management Oversight, US12 Event Impact, US13 Content Quality, and US14 Finance behind Phase 2 flag.
2. Add P3 exports after core page read services stabilize.
3. Complete polish and run the quickstart validation.

---

## Notes

- Do not put public routes behind authentication while adding executive routes.
- Do not import server-only modules into Client Components.
- Do not duplicate metric calculations in presentation components.
- Do not expose PII through page DTOs, exports, logs, or client bundles.
- Use existing dependencies and shared UI primitives unless the chart decision gate explicitly approves a new chart library.
