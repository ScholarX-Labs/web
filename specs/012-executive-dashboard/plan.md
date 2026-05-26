# Implementation Plan: Executive Dashboard Analytics

**Branch**: `012-executive-dashboard` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/012-executive-dashboard/spec.md`

---

## Summary

Build a production-grade Analytics & Operations Command Center for ScholarX leadership. The feature
adds a read-oriented executive analytics workspace with Phase 1 pages for Overview, Users, Courses &
Lessons, Learner Progress, Opportunities & AI, Technical Health, Action Center, and Public Website &
Growth; Phase 2 adds Team Operations and Finance & Unit Economics.

The implementation keeps analytics separate from existing operational admin CRUD. It adds a typed
`src/domain/executive` read-model domain with explicit metric definitions, query services, freshness
metadata, data-gap states, Action Center derivation rules, export contracts, and thin admin-only API
routes. UI pages consume stable DTOs only. Raw database rows, auth internals, and private user data
never flow into dashboard components.

---

## Technical Context

| Dimension | Value |
|-----------|-------|
| Language / Runtime | TypeScript 5, Node 20 LTS |
| Framework | React 19, Next.js 16 App Router |
| ORM | Drizzle ORM (existing) |
| Database | PostgreSQL 16 (source of truth) |
| Cache | Redis (existing spec-011 layer — admin-scoped keys only) |
| Auth | Better Auth (existing admin session guard) |
| Validation | Zod (existing) |
| Client State | TanStack React Query v5 (existing) |
| Styling | Tailwind CSS + shared UI primitives (existing) |
| Motion | Framer Motion (existing) |
| Error Tracking | Sentry (existing — no new SDK) |
| Testing Runtime | Node test runner + tsx + Playwright |

### Pinned Dependency Constraints

No new runtime dependencies may be introduced unless the implementation demonstrates that existing
packages cannot satisfy a requirement. If a chart library is required (see §Chart Library Decision
Gate), it must be evaluated at the chart-library gate before merging.

Existing versions that apply to this feature (treat `package.json` as the source of truth):

| Package | Constraint |
|---------|-----------|
| `drizzle-orm` | existing pinned version — do not upgrade |
| `@tanstack/react-query` | v5 (existing) |
| `zod` | v3 (existing) |
| `framer-motion` | existing pinned version |
| `lucide-react` | existing pinned version |
| Any new charting library | BLOCKED until Chart Library Decision Gate passes |

---

## Performance Goals

| Metric | Target |
|--------|--------|
| KPI cards + primary charts (≤ 90-day range, warm cache) | p95 ≤ 3 s |
| Section refresh (warm cache) | p95 ≤ 2 s |
| Section refresh (cold cache) | p95 ≤ 8 s |
| Export generation (normal filtered range) | ≤ 60 s |
| Query latency logged by section | yes — tracked in `executive.metric_freshness` |
| Cold-cache full-page render budget | p95 ≤ 12 s |

---

## Constraints

- Public, learner, and instructor routes must not gain admin dependencies.
- Executive analytics must not replace or crowd operational admin management pages.
- All analytics DTOs must be explicitly typed; no new `any` in new contracts or services.
- Metric definitions must be centralized and reused by cards, drilldowns, and exports.
- Overview lists, charts, and exports must redact PII unless the user opens an authorized drilldown.
- Personalized / admin data must not be publicly cached.
- Automatic refresh cannot replace values mid-analysis; it must show "updated data available".
- Sections with missing instrumentation must show data-gap states, not fabricated zeros.
- No new charting dependency unless the Chart Library Decision Gate is passed.
- `/speckit.tasks` must not be run until the Pre-Task Resolution Gate in this plan is satisfied.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Plan Response |
|-----------|--------|---------------|
| Proper Architecture & SOLID Patterns | PASS | Dedicated executive read-model domain, repository ports, query services, policy/rule strategies, export service, and page-level composition keep responsibilities isolated. |
| Uncompromising Code Quality & Type Safety | PASS | New DTOs, query inputs, chart series, freshness states, Action Center records, and exports are strict TypeScript types with Zod validation at route boundaries. No new `any`. |
| Rigorous Testing Standards | PASS | Metric calculators, bucketing, redaction, RBAC, Action Center rules, exports, and route contracts get focused tests. Responsive chart and accessibility checks are part of validation. |
| Premium User Experience Consistency | PASS | Workspace follows existing admin shell and shared primitives while introducing dense, scan-friendly executive analytics, stable loading states, keyboard navigation, and accessible chart summaries. |
| Performance, Scalability & Maintainability | PASS | Aggregates live behind read services, cache policy is admin-scoped and short-lived, large tables require indexed time-range queries or rollups, and missing instrumentation degrades gracefully. |

---

## Project Structure

### Documentation (this feature)

```text
specs/012-executive-dashboard/
├── spec.md
├── plan.md                        ← this file
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── executive-dashboard-api-contract.md
│   ├── executive-read-model-contract.md
│   ├── action-center-contract.md
│   └── export-contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── admin/
│   │   ├── executive/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── courses-lessons/page.tsx
│   │   │   ├── learner-progress/page.tsx
│   │   │   ├── opportunities-ai/page.tsx
│   │   │   ├── technical-health/page.tsx
│   │   │   ├── action-center/page.tsx
│   │   │   ├── public-growth/page.tsx
│   │   │   ├── team-operations/page.tsx
│   │   │   └── finance/page.tsx
│   │   └── _components/
│   │       └── admin-sidebar.tsx
│   └── api/
│       └── admin/
│           └── executive/
│               ├── [[...path]]/route.ts
│               └── export/route.ts
├── components/
│   └── executive/
│       ├── charts/
│       │   ├── area-chart.tsx
│       │   ├── bar-chart.tsx
│       │   ├── funnel-chart.tsx
│       │   ├── heatmap.tsx
│       │   └── chart-a11y-summary.tsx
│       ├── filters/
│       │   ├── executive-filter-provider.tsx
│       │   ├── date-range-selector.tsx
│       │   └── active-filter-bar.tsx
│       ├── sections/
│       │   ├── metric-card.tsx
│       │   ├── freshness-badge.tsx
│       │   ├── section-state.tsx
│       │   └── export-button.tsx
│       └── tables/
│           ├── action-items-table.tsx
│           ├── learner-progress-table.tsx
│           └── course-leaderboard-table.tsx
├── domain/
│   └── executive/
│       ├── index.ts
│       ├── contracts/
│       │   ├── executive-types.ts
│       │   ├── executive-query.schemas.ts
│       │   ├── executive-read-repository.contract.ts
│       │   ├── action-center-repository.contract.ts
│       │   └── export-renderer.contract.ts
│       ├── application/
│       │   ├── executive-dashboard.service.ts
│       │   ├── metric-definition.registry.ts
│       │   ├── metric-calculation.policy.ts
│       │   ├── redaction.policy.ts
│       │   ├── freshness.service.ts
│       │   ├── action-center.service.ts
│       │   ├── action-center-rules.ts
│       │   ├── executive-export.service.ts
│       │   └── chart-series.mapper.ts
│       ├── factory/
│       │   └── executive-domain.factory.ts
│       └── infrastructure/
│           └── db/
│               ├── executive.repository.ts
│               ├── action-center.repository.ts
│               └── analytics-event.repository.ts
├── db/
│   └── schema/
│       └── executive-analytics.schema.ts
├── hooks/
│   └── executive/
│       ├── use-executive-page.ts
│       ├── use-action-center.ts
│       └── use-executive-export.ts
└── lib/
    └── executive/
        ├── executive-api-client.ts
        ├── executive-query-keys.ts
        ├── csv-export.ts
        └── date-range.ts
```

---

## Phase 0 Research

Research is captured in [research.md](./research.md). Key resolved decisions:

| Topic | Decision |
|-------|----------|
| Domain boundary | Add `src/domain/executive` as a read-model domain instead of adding more methods to `src/domain/admin`. |
| Data model | Use typed DTOs and optional instrumentation tables for missing event sources; existing source tables remain authoritative. |
| Metric integrity | Centralize definitions in a registry consumed by services, UI labels, and exports. |
| Charting | Start with custom SVG/CSS chart primitives and existing dependencies; defer chart-library dependency to Decision Gate. |
| Action Center | Derive open items from source metrics, persist only workflow state, ownership, dismissal/resolution, and audit trail. |
| Freshness | Track per-section source-query freshness and distinguish true-zero, data-gap, stale, partial, and error states. |
| Exports | Generate CSV for data tables and print/PDF-ready HTML views; log export action to admin audit log. |
| Security | Reuse admin session guard and add executive permission checks; redact overview PII by default. |
| Performance | Prefer indexed aggregate queries, short-lived admin-scoped cache, and rollup/event tables only where raw queries cannot meet goals. |

---

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md): executive workspace entities, DTO fields, validation rules, state transitions, and source ownership.
- [contracts/executive-dashboard-api-contract.md](./contracts/executive-dashboard-api-contract.md): admin-only route contract, query params, response envelope, and errors.
- [contracts/executive-read-model-contract.md](./contracts/executive-read-model-contract.md): repository/service DTO contract and metric state model.
- [contracts/action-center-contract.md](./contracts/action-center-contract.md): rule inputs, severity model, workflow state, and audit behavior.
- [contracts/export-contract.md](./contracts/export-contract.md): CSV/snapshot export behavior, redaction, freshness notes, and audit requirements.
- [quickstart.md](./quickstart.md): local validation, staged rollout, RBAC checks, metric fixture validation, and performance checks.

---

## Architecture

### Executive Read Domain

Create a read-only domain module for executive analytics:

- **`ExecutiveReadRepository`**: typed aggregate queries over existing schema and new analytics event tables.
- **`ExecutiveDashboardService`**: orchestrates page-specific read models, freshness, redaction, and metric definitions.
- **`MetricDefinitionRegistry`**: single source for metric ids, labels, descriptions, calculation notes, sensitivity, chart type, and favorable direction.
- **`MetricCalculationPolicy`**: date bucketing, prior-period calculation, rate calculation, true-zero/data-gap classification, and double-count prevention.
- **`FreshnessService`**: per-section freshness state, last successful source query timestamp, partial failure tracking.
- **`ActionCenterService`**: composes source signals into prioritized actionable items and merges persisted workflow state.
- **`ExecutiveExportService`**: reuses the same read services as the UI and applies export-specific redaction and audit logging.

This is a CQRS-style read model. Operational writes remain in existing admin/course/email domains.
The only writes in this feature are analytics instrumentation, Action Center workflow state,
public-impact governance records, and audit entries.

### API Shape

Phase 1 routes (all require `admin` role):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/executive/overview` | Platform health KPIs |
| GET | `/api/admin/executive/users` | User analytics |
| GET | `/api/admin/executive/courses-lessons` | Course & lesson metrics |
| GET | `/api/admin/executive/courses-lessons/:courseId/lessons` | Lesson-level drilldown |
| GET | `/api/admin/executive/learner-progress` | Progress & completion funnels |
| GET | `/api/admin/executive/opportunities-ai` | Opportunity & AI search metrics |
| GET | `/api/admin/executive/technical-health` | System health signals |
| GET | `/api/admin/executive/action-center` | Derived action items |
| PATCH | `/api/admin/executive/action-center/:itemId` | Workflow state update |
| GET | `/api/admin/executive/public-growth` | Public website & growth |
| POST | `/api/admin/executive/export` | CSV / snapshot export |

Phase 2 routes:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/executive/team-operations` | Team and support ops |
| GET | `/api/admin/executive/finance` | Finance & unit economics |

---

## Gap 1 — Query Performance Strategy Per Table

The following tables carry high read volume and require explicit index recipes before any queries are written.

### Index Recipes

#### `executive.analytics_events`

```sql
-- Primary time-range filter for all event queries
CREATE INDEX CONCURRENTLY idx_ae_type_occurred
  ON executive.analytics_events (event_type, occurred_at DESC);

-- User-scoped queries (drilldowns, per-user AI usage)
CREATE INDEX CONCURRENTLY idx_ae_user_occurred
  ON executive.analytics_events (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

-- Session-scoped anonymous events
CREATE INDEX CONCURRENTLY idx_ae_session_occurred
  ON executive.analytics_events (session_id_hash, occurred_at DESC)
  WHERE session_id_hash IS NOT NULL;
```

Rollup trigger threshold: if a time-range aggregate query on `analytics_events` exceeds **500 ms** at p95 on staging with realistic data volume, introduce a `executive.analytics_events_hourly_rollup` table keyed by `(event_type, hour_bucket)`.

#### `courses.progress_sync_events` (or equivalent progress table)

```sql
-- All progress queries are time-range + user or course scoped
CREATE INDEX CONCURRENTLY idx_pse_user_created
  ON courses.progress_sync_events (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_pse_lesson_created
  ON courses.progress_sync_events (lesson_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_pse_course_created
  ON courses.progress_sync_events (course_id, created_at DESC);
```

Rollup trigger threshold: if a 90-day completion funnel query exceeds **1 s** at p95 on staging, introduce a `courses.lesson_completion_daily_rollup` table keyed by `(lesson_id, day_bucket)`.

#### `executive.action_item_states`

```sql
-- Action Center list view — open items by severity
CREATE INDEX CONCURRENTLY idx_ais_severity_status
  ON executive.action_item_states (severity, status, due_at)
  WHERE status IN ('open', 'in_progress', 'escalated');

-- Source-keyed deduplication
CREATE UNIQUE INDEX idx_ais_source_key
  ON executive.action_item_states (source_key);
```

`executive.action_item_states` must include the `severity`, `rule_id`, `due_at`,
`dismissed_at`, `resolved_at`, and `reopened_count` columns before these indexes are generated.

#### `executive.metric_freshness`

```sql
CREATE UNIQUE INDEX idx_mf_section
  ON executive.metric_freshness (section_id);
```

### Query Latency Monitoring

Every repository method must record its own query latency. The service layer passes the duration to `FreshnessService.recordQueryLatency(sectionId, durationMs)`. Entries older than 90 days are deleted by a nightly job. Alerts fire when p95 latency for any section exceeds 4 s over a 5-minute window.

---

## Gap 2 — Feature Flag Architecture

### Flag Definition

Feature flags for this feature are controlled by a single server-side configuration object. No client-safe flag values exist (flags are never exposed to browser bundles).

```typescript
// src/lib/executive/feature-flags.ts

export type ExecutiveFeatureFlags = {
  /** Phase 1 workspace visible to admin role */
  EXECUTIVE_DASHBOARD_ENABLED: boolean;
  /** Phase 2 Team Operations page */
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: boolean;
  /** Phase 2 Finance & Unit Economics page */
  EXECUTIVE_FINANCE_ENABLED: boolean;
  /** Public Impact metric approval workflow */
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: boolean;
  /** Experimental: AI search heatmap */
  EXECUTIVE_AI_HEATMAP_ENABLED: boolean;
};
```

### Environment Variable Naming Convention

All flag env vars are prefixed `SCHOLARX_EXECUTIVE_` and are server-only (never prefixed `NEXT_PUBLIC_`).

| Env var | Flag | Default |
|---------|------|---------|
| `SCHOLARX_EXECUTIVE_DASHBOARD_ENABLED` | `EXECUTIVE_DASHBOARD_ENABLED` | `false` |
| `SCHOLARX_EXECUTIVE_TEAM_OPS_ENABLED` | `EXECUTIVE_TEAM_OPERATIONS_ENABLED` | `false` |
| `SCHOLARX_EXECUTIVE_FINANCE_ENABLED` | `EXECUTIVE_FINANCE_ENABLED` | `false` |
| `SCHOLARX_EXECUTIVE_GOVERNANCE_ENABLED` | `PUBLIC_IMPACT_GOVERNANCE_ENABLED` | `false` |
| `SCHOLARX_EXECUTIVE_AI_HEATMAP_ENABLED` | `EXECUTIVE_AI_HEATMAP_ENABLED` | `false` |

### Flag Resolution

```typescript
// src/lib/executive/feature-flags.ts (implementation sketch)
import { env } from '@/lib/env'; // existing typed env module

export function getExecutiveFlags(): ExecutiveFeatureFlags {
  return {
    EXECUTIVE_DASHBOARD_ENABLED:
      env.SCHOLARX_EXECUTIVE_DASHBOARD_ENABLED === 'true',
    EXECUTIVE_TEAM_OPERATIONS_ENABLED:
      env.SCHOLARX_EXECUTIVE_TEAM_OPS_ENABLED === 'true',
    EXECUTIVE_FINANCE_ENABLED:
      env.SCHOLARX_EXECUTIVE_FINANCE_ENABLED === 'true',
    PUBLIC_IMPACT_GOVERNANCE_ENABLED:
      env.SCHOLARX_EXECUTIVE_GOVERNANCE_ENABLED === 'true',
    EXECUTIVE_AI_HEATMAP_ENABLED:
      env.SCHOLARX_EXECUTIVE_AI_HEATMAP_ENABLED === 'true',
  };
}
```

Flag checks happen only in:
1. The executive workspace layout (`layout.tsx`) — returns 404 if dashboard is disabled.
2. Individual page routes — return 404 for disabled Phase 2 pages.
3. API route handlers — return 404 before session checks if the section is disabled.

Flag values must never reach Client Components.

---

## Gap 3 — Migration Strategy

### Ordering

Migrations must be applied in this exact order. Each migration is a separate numbered file under `drizzle/migrations/`.

| Order | Migration file | Description |
|-------|---------------|-------------|
| 1 | `0012_executive_analytics_events.sql` | Create `executive.analytics_events` table |
| 2 | `0013_executive_action_item_states.sql` | Create `executive.action_item_states` table |
| 3 | `0014_executive_metric_freshness.sql` | Create `executive.metric_freshness` table |
| 4 | `0015_executive_public_impact_metrics.sql` | Create `executive.public_impact_metrics` table |
| 5 | `0016_executive_indexes.sql` | Add all indexes from Gap 1 (CONCURRENTLY on production) |

### Rollback Steps

Each migration has a corresponding down migration. Rollbacks must be run in reverse order.

```sql
-- Rollback for 0016: drop indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_ae_type_occurred;
DROP INDEX CONCURRENTLY IF EXISTS idx_ae_user_occurred;
DROP INDEX CONCURRENTLY IF EXISTS idx_ae_session_occurred;
DROP INDEX CONCURRENTLY IF EXISTS idx_pse_user_synced;
DROP INDEX CONCURRENTLY IF EXISTS idx_pse_lesson_synced;
DROP INDEX CONCURRENTLY IF EXISTS idx_pse_course_synced;
DROP INDEX CONCURRENTLY IF EXISTS idx_ais_severity_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_ais_source_key;
DROP INDEX CONCURRENTLY IF EXISTS idx_mf_section;

-- Rollback for 0015–0012: drop tables
DROP TABLE IF EXISTS executive.public_impact_metrics;
DROP TABLE IF EXISTS executive.metric_freshness;
DROP TABLE IF EXISTS executive.action_item_states;
DROP TABLE IF EXISTS executive.analytics_events;
DROP SCHEMA IF EXISTS executive;
```

### Production Index Creation

On production PostgreSQL, use `CREATE INDEX CONCURRENTLY` to avoid table locks. Drizzle migrations
do not support `CONCURRENTLY` natively, so `0016_executive_indexes.sql` must be run manually with
`psql` after the table migrations are applied. CI/staging environments may use regular `CREATE INDEX`.

### Pre-Migration Checklist

- [ ] All new tables have been reviewed by a second engineer.
- [ ] `EXPLAIN ANALYZE` run on representative queries against a staging data copy.
- [ ] Rollback script tested on staging before applying to production.
- [ ] Index migration script reviewed for lock risk.

---

## Gap 4 — Caching TTL Table

All cache entries are admin-scoped (never public). Redis keys use the namespace prefix `exec:`.

### Key Namespacing Convention

```
exec:{section}:{queryHash}
```

Where `{queryHash}` is a deterministic SHA-256 of the normalized query parameters (date range, filters). Example:

```
exec:overview:a3f1e9b2
exec:users:c7d4f012
exec:courses:a1b2c3d4
exec:action-center:open
```

### TTL Table

| Section | Cache key pattern | TTL | Invalidation trigger |
|---------|-------------------|-----|----------------------|
| Overview KPIs | `exec:overview:{hash}` | 5 min | Manual flush or post-export |
| Users | `exec:users:{hash}` | 5 min | None (time-based) |
| Courses & Lessons | `exec:courses:{hash}` | 10 min | None (time-based) |
| Learner Progress | `exec:progress:{hash}` | 10 min | None (time-based) |
| Opportunities & AI | `exec:opps-ai:{hash}` | 5 min | None (time-based) |
| Technical Health | `exec:tech-health:{hash}` | 2 min | Circuit state change event |
| Action Center | `exec:action-center:open` | 2 min | Action Center PATCH write |
| Public Growth | `exec:public-growth:{hash}` | 15 min | None (time-based) |
| Export payload | `exec:export:{hash}` | 60 s | Immediate after download |
| Metric freshness | Never cached | — | Always read from DB |

### Invalidation Rules

1. After any `PATCH /api/admin/executive/action-center/:itemId`, delete `exec:action-center:open`.
2. After an export completes, delete `exec:export:{hash}`.
3. Technical Health keys expire at 2 min or are proactively deleted when the email circuit state changes.
4. No other manual invalidation; TTL is the sole eviction mechanism for all other sections.
5. Cache entries must never hold PII or user-identifiable data; only aggregate counts and derived metrics.

### Cache Miss Behavior

On Redis unavailability, the service layer falls through to a direct database query. The response
includes a freshness note indicating the cache was bypassed. No error is surfaced to the UI.

---

## Gap 5 — RBAC Role Policy Matrix

Phase 1 ships with `admin` role only. The domain is designed to support finer-grained roles in
Phase 2 without restructuring. The matrix below defines the target policy — roles marked Phase 2+
are not activated until explicitly enabled via feature flag and migration.

### Role Definitions

| Role ID | Display name | Phase |
|---------|-------------|-------|
| `admin` | Platform Admin | 1 |
| `executive` | Executive (read-only) | 2 |
| `operations` | Operations Lead | 2 |
| `growth` | Growth Analyst | 2 |
| `finance` | Finance Analyst | 2 |

### Permission Matrix

| Page / Action | `admin` | `executive` | `operations` | `growth` | `finance` |
|---------------|---------|------------|-------------|---------|---------|
| Overview | ✅ | ✅ | ✅ | ✅ | ✅ |
| Users | ✅ | ✅ | ✅ | ✅ | ❌ |
| Courses & Lessons | ✅ | ✅ | ✅ | ✅ | ❌ |
| Learner Progress | ✅ | ✅ | ✅ | ❌ | ❌ |
| Opportunities & AI | ✅ | ✅ | ✅ | ✅ | ❌ |
| Technical Health | ✅ | ✅ | ✅ | ❌ | ❌ |
| Action Center (view) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Action Center (update) | ✅ | ❌ | ✅ | ❌ | ❌ |
| Public Growth | ✅ | ✅ | ✅ | ✅ | ❌ |
| Team Operations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Finance & Unit Economics | ✅ | ✅ | ❌ | ❌ | ✅ |
| Export (own sections) | ✅ | ✅ | ✅ | ✅ | ✅ |
| PII drilldown | ✅ | ❌ | ❌ | ❌ | ❌ |
| Public impact approval | ✅ | ✅ | ❌ | ❌ | ❌ |

### Policy Implementation

The policy is encoded in `src/domain/executive/application/executive-access.policy.ts` as a pure
function: `canAccess(role: ExecutiveRole, resource: ExecutiveResource, action: 'read' | 'write'): boolean`.
Route handlers call this function after session resolution. New roles are activated by adding them
to the Zod `ExecutiveRole` union and updating the matrix function — no structural change required.

---

## Gap 6 — Action Center Rule Severity Table

Each rule produces items with a fixed default severity. Severity may be upgraded at runtime if the
rule's threshold crosses a higher tier.

| Rule ID | Description | Default severity | Upgrade condition |
|---------|-------------|-----------------|-------------------|
| `stalled-learner` | Learner inactive ≥ 14 days with incomplete course | `medium` | Inactive ≥ 30 days → `high` |
| `low-completion-course` | Course completion rate < 30 % | `medium` | Rate < 15 % → `high` |
| `critical-drop-lesson` | Lesson completion rate dropped > 20 pp vs prior period | `high` | Always `high` |
| `sla-breach-inquiry` | Inquiry unanswered > 48 h | `high` | > 72 h → `critical` |
| `expiring-opportunity` | Opportunity deadline within 7 days, still published | `medium` | Within 3 days → `high` |
| `failed-email` | Email delivery failure rate > 5 % in last 24 h | `high` | Rate > 20 % → `critical` |
| `pending-certificate` | Certificate pending generation > 48 h after eligibility | `medium` | > 72 h → `high` |
| `security-spike` | Auth failure rate > 3× baseline in 1 h | `high` | > 5× baseline → `critical` |
| `data-freshness-failure` | Section data not refreshed in > 2× expected window | `low` | > 3× window → `medium` |
| `public-impact-pending` | Public impact counter pending approval > 7 days | `low` | > 14 days → `medium` |
| `opportunity-link-broken` | Opportunity external URL returns non-200 in last check | `medium` | Always `medium` |

### Severity Definitions

| Severity | Badge color | SLA for resolution | Sort position |
|----------|------------|-------------------|---------------|
| `critical` | Red | 4 h | 1 (top) |
| `high` | Orange | 24 h | 2 |
| `medium` | Yellow | 72 h | 3 |
| `low` | Blue | 7 days | 4 |

### Reopening Logic

When an item is dismissed or resolved, its `status` is set to `dismissed` / `resolved` and the
`dismissed_at` / `resolved_at` timestamp is recorded. The item is not deleted.

A background check (nightly cron or on-demand when the section refreshes) re-evaluates the rule
against current data. If the condition **still holds or recurs** after a dismissal:

| Prior status | Recurrence window | Action |
|-------------|-------------------|--------|
| `dismissed` | Condition present at next rule evaluation | Set status → `open`, bump `reopened_count`, log audit entry |
| `resolved` | Condition recurs within 30 days | Set status → `open`, bump `reopened_count`, log audit entry |
| `resolved` | Condition recurs after 30 days | Create a **new** item with `reopened_count = 0` |

The stable `source_key` (composite of `rule_id + entity_id`) ensures deduplication. A reopened
item retains its full audit history. Admins can see `reopened_count` in the Action Center table.

---

## Gap 7 — Observability & Monitoring Plan

### Error Tracking

Use the existing Sentry integration. No new SDK. Add the following structured context to executive
domain errors:

```typescript
Sentry.withScope((scope) => {
  scope.setTag('domain', 'executive');
  scope.setTag('section', sectionId);
  scope.setContext('query', { dateRange, filters });
  Sentry.captureException(error);
});
```

All executive repository errors are caught at the service layer, logged to Sentry, and converted to
`SectionState.error` — they never propagate as unhandled exceptions.

### Metric Query Latency Monitoring

Each repository method wraps its query in a timing helper:

```typescript
const start = performance.now();
const result = await db.query(...);
const durationMs = performance.now() - start;
await freshnessService.recordQueryLatency(sectionId, durationMs);
```

Latency entries are stored in `executive.metric_freshness.last_query_duration_ms`. The Technical
Health page surfaces p95 section latency as a chart. Sentry Performance captures slow queries
(> 2 s) as transactions automatically via the existing Sentry Next.js SDK.

### Alerting Thresholds

| Signal | Threshold | Alert channel |
|--------|-----------|---------------|
| Section query p95 > 4 s | 5-minute window | Existing on-call channel |
| Export generation > 90 s | Per export | Existing on-call channel |
| Action Center rule evaluation failure | Any | Sentry issue |
| Redis unavailability (cache bypass) | > 5 min | Existing infra alert |
| Analytics event ingestion failure | Any | Sentry issue |

### Audit Log

Every Action Center state transition and every export are written to `auth.admin_audit_log` (existing)
with at minimum:

```json
{
  "actor_id": "admin-user-id",
  "action": "executive.action_item.update",
  "resource_type": "action_item",
  "resource_id": "item-uuid",
  "payload_summary": { "from": "open", "to": "in_progress" },
  "occurred_at": "ISO-8601"
}
```

Export audit entries include `section`, `date_range`, `filters`, and `row_count`.

---

## Gap 8 — Chart Library Decision Gate

The plan defers a chart library decision until implementation. This gate makes the decision
structured and blocking.

### Decision Trigger

The gate opens when **any of the following** is observed during implementation:

1. A required chart type (e.g., heatmap with > 168 buckets) cannot be rendered accessibly with
   custom SVG within a 2-day implementation effort.
2. A performance issue with custom SVG rendering causes layout shifts or exceeds 100 ms frame time
   on mid-range hardware.
3. More than 3 chart types require the same interaction behavior (zoom, brush) that custom SVG
   cannot deliver without significant complexity.

### Decision Criteria

The gate does **not** open for cosmetic preference. If the gate opens, evaluate in this order:

| Candidate | Bundle size impact | Tree-shakeable | SSR compatible | License |
|-----------|-------------------|----------------|----------------|---------|
| `recharts` | ~140 KB gzip | partial | yes | MIT |
| `victory` | ~250 KB gzip | partial | yes | MIT |
| `nivo` | ~100 KB gzip (per pkg) | yes | yes | MIT |

**Decision owner**: Tech Lead. Must be recorded as a comment in `plan.md` under this section with
the candidate chosen, the triggering reason, and the bundle impact.

**Fallback**: If no library is acceptable, implement only the chart types achievable with custom SVG
and mark remaining chart types as deferred.

The gate must be resolved and recorded before any chart-library import is merged.

---

## Gap 9 — API Rate Limiting & Throttling

### Export Route

Export generation is the most expensive operation. Apply the following controls:

| Control | Value |
|---------|-------|
| Rate limit per admin user | 5 exports per 10 minutes |
| Concurrent exports per instance | 3 (semaphore-guarded) |
| Max row count before async job | 50,000 rows |
| Max date range for synchronous export | 365 days |

For exports exceeding the row or range limit, the route returns `202 Accepted` with a job ID.
The admin polls `GET /api/admin/executive/export/status/:jobId` (Phase 2) or is notified via
admin notification (future). Phase 1 enforces the limits and returns `413 Payload Too Large` if
exceeded without async support.

### Read Route Rate Limiting

Apply per-admin-user rate limiting on all executive GET routes using the existing middleware pattern:

| Window | Max requests |
|--------|-------------|
| 1 minute | 120 requests |
| 1 hour | 2,000 requests |

Rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) are returned
on every response. Exceeding the limit returns `429 Too Many Requests`.

---

## Gap 10 — Data Seeding & Fixture Strategy

### Philosophy

Tests must not depend on production or staging data. All integration and contract tests operate
against a seeded in-memory or isolated test database.

### Fixture Files

Create `src/domain/executive/__tests__/fixtures/` with:

```text
fixtures/
├── users.fixture.ts          — 50 users, varied roles, signup dates
├── courses.fixture.ts        — 10 courses, varied completion rates
├── lessons.fixture.ts        — 5 lessons per course, varied drop rates
├── progress-events.fixture.ts — 1,000 progress events across 90 days
├── inquiries.fixture.ts      — 30 inquiries, some breaching 48h SLA
├── analytics-events.fixture.ts — AI search events, opportunity clicks
├── action-item-states.fixture.ts — Open/dismissed/resolved items
└── email-deliveries.fixture.ts — Normal and failed delivery batches
```

### Seeding Approach

```typescript
// src/domain/executive/__tests__/helpers/seed.ts
export async function seedExecutiveFixtures(db: DrizzleDb): Promise<FixtureIds> {
  // Insert in dependency order: users → courses → lessons → progress → events
  const userIds = await insertUsers(db, USERS_FIXTURE);
  const courseIds = await insertCourses(db, COURSES_FIXTURE);
  // ...
  return { userIds, courseIds, lessonIds, eventIds };
}

export async function teardownExecutiveFixtures(db: DrizzleDb): Promise<void> {
  await db.execute(sql`TRUNCATE executive.analytics_events, executive.action_item_states RESTART IDENTITY CASCADE`);
}
```

Each test file calls `beforeEach(seed)` and `afterEach(teardown)`. Tests reference stable fixture
entity IDs from `FixtureIds` rather than hardcoded UUIDs.

### Metric Fixture Validation

Fixture data is designed so that exact metric outputs are predictable:

| Fixture scenario | Expected output | Tested in |
|-----------------|-----------------|-----------|
| 10 lessons, lesson 3 drops 25 pp | `critical-drop-lesson` rule fires for lesson 3 | `action-center-rules.test.ts` |
| 3 inquiries older than 48h | 3 `sla-breach-inquiry` items | `action-center-rules.test.ts` |
| Progress heatmap: 200 events at 14:00 UTC Tuesday | Peak bucket = Tuesday 14:00 | `heatmap-buckets.test.ts` |
| 5 failed email deliveries in 24h window | Failure rate > 5% → `failed-email` rule fires | `action-center-rules.test.ts` |

---

## Gap 11 — Public Impact Metric Approval Workflow

### States

```
draft → pending_review → approved → published
                      ↘ rejected → draft
```

### Workflow Steps

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1 | Admin (Growth/Operations) | Proposes updated counter value with rationale | Status → `pending_review` |
| 2 | Executive / Platform Admin | Reviews in Public Growth page | Approves or rejects |
| 3a | Approved | Reviewer approves | Status → `approved`; if `auto_publish = true`, → `published` |
| 3b | Rejected | Reviewer rejects with reason | Status → `rejected`; proposer notified |
| 4 | Admin | Re-submits revised value | Status → `draft` → `pending_review` |
| 5 | Published | Automated or manual publish | Counter is live on public site |

### Governance Rules

- Only users with `admin` or `executive` role may approve.
- A user cannot approve their own proposal.
- All state transitions are appended to `executive.public_impact_metrics.audit_trail` (JSONB array).
- Rejected proposals retain the rejection reason and reviewer ID.
- A proposal is automatically expired (status → `expired`) if not reviewed within 30 days.
- Phase 1 ships the governance table and workflow API; public site display is a separate integration task.

### API Routes for Governance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/executive/public-growth/metrics` | List impact metrics and their states |
| POST | `/api/admin/executive/public-growth/metrics` | Propose a new or updated counter |
| PATCH | `/api/admin/executive/public-growth/metrics/:id/approve` | Approve |
| PATCH | `/api/admin/executive/public-growth/metrics/:id/reject` | Reject with reason |

---

## Gap 12 — Staged Rollout Milestones & Acceptance Criteria

### Milestone Table

| Milestone | Deliverable | Acceptance criteria | Owner |
|-----------|------------|---------------------|-------|
| M0: Foundation | Contracts, schemas, domain services merged | TypeScript build passes; all unit tests pass; no `any` in new code | Tech Lead |
| M1: API | Executive API routes live on staging | Contract tests pass (RBAC, validation, redaction); export audit entries written; 401/403 for non-admin | Tech Lead |
| M2: Shell + Overview | Executive layout + Overview page live on staging behind flag | Page loads < 3 s; KPI cards match raw DB counts on fixture data; no PII in overview response; flag disables page correctly | Tech Lead + PM |
| M3: Core Pages | Users, Courses & Lessons, Learner Progress, Action Center pages | Each page loads in budget; Action Center items match rule outputs on fixture; drilldowns require elevated permission | Tech Lead |
| M4: Remaining Pages | Opportunities & AI, Technical Health, Public Growth | Email circuit state visible; AI search metrics present or show data-gap; governance workflow functional | Tech Lead + PM |
| M5: Stakeholder Acceptance | CEO/CTO scenario walkthrough | CEO can generate an export and compare to raw sample; CTO can see all Technical Health signals; no metric discrepancy > 1 % | CEO + CTO + Tech Lead |
| M6: Production Phase 1 | Flag enabled in production | Zero error-budget spend in first 48 h; no PII leak in logs; p95 page load within target | Tech Lead + DevOps |
| M7: Phase 2 | Team Operations + Finance pages | Source data verified; ownership data populated; unit economics metrics accurate | Tech Lead + PM |

### Definition of Done (per milestone)

- Build passes (`next build` or `tsc --noEmit`).
- All new tests pass.
- No regressions in existing admin tests.
- Relevant acceptance criteria explicitly checked and recorded in the PR description.

---

## Gap 13 — Pre-Task Resolution Gate

The following decisions must be reflected in `tasks.md` generation. If any item remains unresolved,
do not run `/speckit.tasks`; update this plan and the relevant design artifact first.

### Required Artifact Coverage

| Item | Required plan decision | Artifact follow-up required before implementation |
|------|------------------------|---------------------------------------------------|
| Task generation | `tasks.md` is currently missing and is required before `/speckit.implement`. | Run `/speckit.tasks` only after this gate is satisfied. |
| Phase 1 access | Phase 1 is `admin`-only in code because the current app has an admin guard. The UI may target leadership personas, but non-admin `executive`, `operations`, `growth`, and `finance` roles stay Phase 2 until explicitly modeled and feature-flagged. | `tasks.md` must include RBAC tests proving learners, instructors, and unauthenticated users receive 401/403, and that Phase 2 roles do not accidentally gain access. |
| API contract depth | Every Phase 1 route needs concrete DTOs for request query, response sections, chart points, table pagination, sorting, redaction notes, and partial/data-gap states. | Expand `contracts/executive-dashboard-api-contract.md` before route implementation tasks begin. |
| Public Impact state machine | Canonical states are `draft`, `pending_review`, `approved`, `published`, `rejected`, `expired`, and `manual_override`. User-facing copy may display `pending_review` as "pending approval". | Update `data-model.md` and contracts so `approvalStatus` is not limited to the older `pending_approval | approved | manual_override` set. |
| Public Impact governance routes | Governance APIs are part of Phase 1 backend scope, but public-site rendering of approved counters is not. | Add contract entries for list/propose/approve/reject routes before API route tasks are generated. |
| Action Center persistence | `executive.action_item_states` stores derived workflow state, not all derived analytics rows. It must include `rule_id`, `severity`, `source_key`, `due_at`, `dismissed_at`, `resolved_at`, `reopened_count`, and last-seen timestamps. | Update `data-model.md` and migration tasks to match Gap 6 reopening logic and Gap 1 indexes. |
| Metric freshness latency | `executive.metric_freshness` stores freshness plus query timing: `last_query_duration_ms` and `rolling_p95_duration_ms` for section latency display. | Update `data-model.md`, migration tasks, and `FreshnessService` tests. |
| Certificate reporting source | Use `certificates.certificates` as the canonical issued/revoked certificate reporting source. `courses.certificates` is legacy/compatibility data and must not be double-counted unless explicitly reconciled. | Update data-source notes and fixture tasks so certificate metrics use one canonical source. |
| Progress event timestamps | Heatmap and progress activity indexes use `courses.progress_sync_events.created_at`; no `synced_at` column is assumed. | Migration/index tasks must use the actual Drizzle schema column names. |
| Export overflow behavior | Phase 1 does not include async export polling. Exports over 50,000 rows or 365 days return `413 Payload Too Large` with a safe explanation. `202 Accepted` and `/export/status/:jobId` are Phase 2. | Contract tests must cover normal export, rate limit, and overflow rejection. |
| Requirement IDs | Current FR IDs intentionally skip `081`, `082`, `088-090`, `095`, and `096` unless the spec is renumbered. | `tasks.md` must map to existing FR IDs only and must not invent missing IDs. |

### Contract Completion Checklist

Before implementation tasks start, each Phase 1 route contract must define:

- Required and optional query parameters, including default page size and maximum page size for tables.
- Response envelope with stable `pageId`, `generatedAt`, `sections`, `freshnessSummary`, and `redactionNotes`.
- Concrete section payload shapes for KPI cards, charts, tables, drilldowns, and Action Center items.
- Role-based redaction behavior for each route and export format.
- Error envelopes for validation failure, access denied, data gap, rate limit, and disabled feature flag.

---

## Implementation Steps

1. Complete the Pre-Task Resolution Gate: reconcile data model fields, API contracts, state machines, canonical data sources, and Phase 1 access scope.
2. Generate `tasks.md` with `/speckit.tasks` only after the gate above is complete.
3. Add `src/domain/executive/contracts` with strict DTOs, query schemas, metric ids, page ids, section states, chart models, redaction levels, and export types.
4. Add `src/lib/executive/feature-flags.ts` with `ExecutiveFeatureFlags` type and `getExecutiveFlags()` resolver.
5. Add `src/db/schema/executive-analytics.schema.ts` for analytics events, Action Center workflow state, freshness, and public-impact governance.
6. Apply migrations in dependency order (0012–0015 tables, then 0016 indexes via `CONCURRENTLY`), using actual Drizzle column names and the reconciled persistent fields from Gap 13.
7. Implement `MetricDefinitionRegistry` and `MetricCalculationPolicy`.
8. Implement `ExecutiveReadRepository` aggregate queries for Phase 1: overview, users, courses/lessons, learner progress, opportunities/AI, technical health, public-growth, and export sources — all using indexed time-range filters.
9. Implement data-gap adapters for optional instrumentation.
10. Implement `FreshnessService` with query latency recording and route-safe section error handling.
11. Implement `ActionCenterRules` as composable rule strategies (see Gap 6 severity table and reopening logic).
12. Implement `ActionCenterRepository` for owner/status/resolution state, audit writes, and reopen detection.
13. Implement `ExecutiveDashboardService` page read-model methods.
14. Implement `ExecutiveExportService` with CSV and print snapshot payload generation, overflow rejection, rate limiting enforcement, and audit logging.
15. Implement `executive-access.policy.ts` with the RBAC matrix from Gap 5.
16. Add admin-only API route handlers under `src/app/api/admin/executive` with rate limiting middleware and export throttle.
17. Add Public Impact governance route handlers under `src/app/api/admin/executive/public-growth/metrics`.
18. Add typed API client and query keys under `src/lib/executive`.
19. Build shared UI primitives: metric cards, freshness badges, section states, accessible chart primitives, filter provider, export button, action items table.
20. Build Phase 1 pages under `src/app/admin/executive` with feature flag guards.
21. Add sidebar/navigation entry without changing existing admin CRUD routes.
22. Add unit tests for calculations, bucketing, redaction, freshness states, Action Center rules (including severity upgrade and reopening), export payloads, public-impact state transitions, and data-gap handling.
23. Add route-handler contract tests for RBAC, query validation, redaction, response envelope, export audit, export overflow rejection, Public Impact governance, and rate limits.
24. Add Playwright checks for desktop/tablet/mobile chart readability, keyboard navigation, and export flow.

---

## Testing Strategy

### Unit Tests

- Date range presets and prior-period calculation.
- Time-axis resolution: daily ≤ 30 days, weekly ≤ 90 days, monthly > 90 days.
- 24 × 7 heatmap buckets UTC timestamps correctly.
- Active user definition counts users with ≥ 1 progress event in range.
- Active subscription definition excludes cancelled, refunded, and expired records.
- Net subscription calculation prevents double-counting manual grants.
- Lesson critical drop rule fires only when completion rate drops > 20 pp.
- Stalled learner rule uses 14-day inactivity window; upgrades to `high` at 30 days.
- Inquiry SLA breach rule uses default 48-hour threshold; upgrades to `critical` at 72 h.
- Opportunity expiry severity buckets 7/14/3-day windows correctly.
- True-zero and data-gap state classification.
- Redaction policy removes PII from overview/export DTOs.
- Metric registry labels match exported metric ids.
- Action Center status transitions reject invalid jumps.
- Dismissed item is reopened when rule condition persists at next evaluation.
- Resolved item creates a new item if condition recurs after 30 days.
- `getExecutiveFlags()` reads env vars and returns correct boolean values.
- RBAC policy matrix: each role/resource/action combination returns correct boolean.

### Route Contract Tests

- Non-admin requests receive 401/403 for all executive routes.
- Authorized admin receives typed success envelopes.
- Invalid date range returns 422 with field errors.
- Exports log an audit entry with filters and generated timestamp.
- Restricted fields are absent from overview and export responses.
- Missing optional instrumentation returns `data-gap`, not 500.
- Section-level source failure returns partial page response with failed section state.
- Rate limiting returns 429 after threshold is exceeded.
- Disabled feature flag causes route to return 404.

### Integration Tests

- Controlled fixture highlights the correct heatmap peak hour.
- Controlled fixture produces the correct funnel and critical-drop flags.
- Controlled fixture with known inquiries produces correct SLA-breach Action Center items.
- Email provider circuit state appears in Technical Health.
- Admin audit log status changes appear in Technical Health after Action Center update.
- Export totals match page totals for the same filters.
- Seeded fixture teardown leaves no orphaned rows.

### UI / E2E Checks (Playwright)

- Admin can open all Phase 1 pages and retain filters across navigation.
- Learner cannot access executive workspace.
- Keyboard user can navigate filters, tabs/sidebar, chart summaries, tables, and export action.
- 1280px, 768px, and 375px screenshots show no clipped chart labels or overlapping controls.
- Automatic refresh shows "Updated data available" instead of changing values immediately.
- Export download triggers and produces a valid CSV.

---

## Rollout Plan

| Step | Action | Acceptance gate |
|------|--------|-----------------|
| 1 | Merge contracts, schemas, domain services | M0 acceptance criteria |
| 2 | Enable API routes on staging (flag on) | M1 acceptance criteria |
| 3 | Ship executive shell + Overview/Technical Health pages (flag on, staging) | M2 acceptance criteria |
| 4 | Add remaining Phase 1 pages to staging | M3 + M4 acceptance criteria |
| 5 | Stakeholder acceptance walk-through | M5 acceptance criteria |
| 6 | Enable Phase 1 in production | M6 acceptance criteria |
| 7 | Verify source data; enable Phase 2 pages | M7 acceptance criteria |

---

## Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Metric totals differ between cards, drilldowns, and exports | Leadership loses trust | Central metric registry and shared service methods for UI/export. |
| Missing instrumentation is mistaken for zero usage | Bad decisions | Data-gap state with source/freshness explanation. |
| Analytics queries become slow on event tables | Dashboard misses performance goals | Indexed time-range queries (Gap 1), short-lived cache (Gap 4), section refresh, measured rollups at defined thresholds. |
| PII leaks through charts or exports | Privacy/security incident | Redaction policy tested at service and route layers; RBAC matrix enforced (Gap 5). |
| Action Center duplicates derived items | Operations noise | Stable source keys, deduplication index, and persisted workflow state keyed by source/entity/rule. |
| Dismissed items silently stay dismissed despite recurrence | Operational blind spots | Defined reopening logic with audit trail (Gap 6). |
| Existing admin pages become cluttered | Admin UX regression | Separate `/admin/executive` workspace and read-only analytics navigation. |
| New roles conflict with admin authorization | Access control gaps | Explicit RBAC matrix (Gap 5); Phase 2 roles blocked until feature flag enabled. |
| Chart library dependency bloat | Slower app and maintenance cost | Decision Gate required before any chart library import (Gap 8). |
| Export generation overloads server | Degraded performance for all users | Rate limiting, concurrency semaphore, row/range limits (Gap 9). |
| Migration error in production | Data loss or lock | Ordered migrations, rollback scripts, pre-migration checklist (Gap 3). |
| Feature visible before ready | Premature user exposure | Feature flag architecture with env var control (Gap 2). |
| Tests depend on production data | Flaky tests | Fixture seeding strategy with teardown (Gap 10). |
| Public impact counters published without review | Misleading public data | Governance workflow with approval gate (Gap 11). |

---

## Post-Design Constitution Check

| Principle | Status | Design Response |
|-----------|--------|-----------------| 
| Proper Architecture & SOLID Patterns | PASS | Query, freshness, calculation, redaction, export, and Action Center concerns are isolated behind ports and services. RBAC policy is a pure function, not embedded in routes. |
| Uncompromising Code Quality & Type Safety | PASS | Design requires strict DTOs and schemas; no `any` in new executive contracts; feature flags are typed. |
| Rigorous Testing Standards | PASS | Unit, route, integration, and UI checks directly cover the high-risk metric, RBAC, export, visualization, flag, and reopening behavior. |
| Premium User Experience Consistency | PASS | UI plan uses existing admin shell and shared primitives with dense executive information design, stable states, and accessibility. |
| Performance, Scalability & Maintainability | PASS | Queries are bounded and indexed with explicit rollup thresholds, cache is intentional with a TTL table, and rollups are introduced only when measured need exists. |

---

## Complexity Tracking

No constitution violations. The separate `src/domain/executive` module is justified because the
feature is a cross-domain read model over many existing sources and must maintain metric integrity,
redaction, exports, and Action Center rules without bloating admin CRUD services.

The following extensions were added in this revision to make the plan production-grade:

1. **Query performance strategy** — index recipes and rollup thresholds per high-volume table.
2. **Feature flag architecture** — typed flag struct, env var naming convention, resolution function.
3. **Migration strategy** — ordered migration files, rollback scripts, CONCURRENTLY index note, pre-migration checklist.
4. **Caching TTL table** — key namespace, per-section TTLs, invalidation rules, cache miss behavior.
5. **RBAC role policy matrix** — all roles × resources × actions tabulated, encoded as pure policy function.
6. **Action Center severity table** — all rules tabulated with default severity, upgrade condition, and SLA.
7. **Observability / monitoring plan** — Sentry context, latency recording, alerting thresholds, audit log schema.
8. **Chart library decision gate** — trigger conditions, candidate evaluation table, decision owner, fallback.
9. **API rate limiting & throttling** — per-user limits, concurrency semaphore, export row/range limits.
10. **Data seeding / fixture strategy** — fixture files, seed/teardown helpers, metric fixture validation table.
11. **Public impact metric approval workflow** — state machine, workflow steps, governance rules, API routes.
12. **Staged rollout milestones** — milestone table with deliverables, acceptance criteria, and definition of done.
13. **Dependency version pinning constraints** — constraint table referencing `package.json` as source of truth.
14. **Pre-task resolution gate** — explicit blockers for task generation: missing `tasks.md`, contract depth, state-machine reconciliation, canonical data sources, export overflow behavior, and FR ID hygiene.
15. **Environment variable naming convention** — captured under Gap 2.
16. **Action Center reopening logic** — recurrence window table, new-item vs. reopen logic, audit trail retention.
