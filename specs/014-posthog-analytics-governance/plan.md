# Implementation Plan: PostHog Analytics Governance

**Branch**: `012-executive-dashboard` | **Date**: 2026-05-28 | **Spec**: [specs/014-posthog-analytics-governance/spec.md](C:/Users/dell/Documents/ScholarX/V2/web/specs/014-posthog-analytics-governance/spec.md)
**Input**: Feature specification from `/specs/014-posthog-analytics-governance/spec.md`

## Summary

Establish a production-grade analytics governance and instrumentation system for ScholarX using a hybrid strategy: PostHog as the primary analytics platform plus a curated internal event mirror for executive dashboard KPI continuity. The implementation introduces a canonical event taxonomy, typed contracts, privacy guardrails, fail-open emission, identity stitching, and KPI reconciliation controls to ensure performance, scalability, maintainability, and data trust.

## Technical Context

**Language/Version**: TypeScript (Next.js App Router runtime)  
**Primary Dependencies**: Next.js, React, Drizzle ORM, Better Auth, PostHog SDK (already configured), Zod-style validation patterns in existing codebase  
**Storage**: PostgreSQL (`executive.analytics_events`) + PostHog managed analytics storage  
**Testing**: Repository test stack (`pnpm run test`) + existing unit/integration/e2e patterns  
**Target Platform**: Web (public + authenticated + admin-separated surfaces)  
**Project Type**: Web application (single Next.js monorepo-style app)  
**Performance Goals**: No user-visible latency regression on tracked interactions; non-blocking event capture on critical flows  
**Constraints**: Preserve public/auth/admin boundaries; no private token leakage; fail-open behavior mandatory; strict type safety  
**Scale/Scope**: All P1 growth/funnel surfaces + core opportunity/search signals + executive KPI-mapped internal mirror

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle I (Architecture/SOLID): PASS
  - Plan uses clear boundary interfaces and separates event definition, emission, normalization, and mirroring responsibilities.
- Principle II (Type Safety/Quality): PASS
  - Contracts mandate strongly typed event schemas and strict property validation.
- Principle III (Testing): PASS
  - Plan includes unit, integration, and e2e verification for critical flows and reconciliation.
- Principle IV (UX Consistency): PASS
  - Tracking is non-blocking and invisible to user interaction quality; no UI degradation introduced.
- Principle V (Performance/Scalability/Maintainability): PASS
  - Fail-open asynchronous capture, bounded retries, and staged rollout reduce risk and preserve scalability.

No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/014-posthog-analytics-governance/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── event-dictionary.md
│   └── kpi-mapping.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (public routes for page/CTA instrumentation)
│   └── api/
│       └── analytics/ (if internal ingestion route is used)
├── components/
│   └── analytics/ (client tracking boundary and wrappers)
├── lib/
│   └── executive/
│       ├── analytics/ (contracts, normalization, routing)
│       └── feature-flags.ts
├── domain/
│   └── executive/
│       ├── contracts/
│       ├── application/
│       └── infrastructure/db/
│           └── analytics-event.repository.ts
└── db/
    └── schema/
        └── executive-analytics.schema.ts

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Use the existing Next.js/domain layering. Add analytics-specific contracts and services under `src/lib/executive/analytics` and reuse existing `domain/executive/infrastructure/db` repository for curated mirroring. Keep route handlers thin and delegate business rules to libraries/domain services.

## Phase 0: Outline & Research

Completed in [research.md](C:/Users/dell/Documents/ScholarX/V2/web/specs/014-posthog-analytics-governance/research.md).

Key outcomes:
1. Hybrid architecture selected (PostHog + curated internal mirror).
2. Typed contract boundary selected (compile-time + runtime validation).
3. Fail-open non-blocking emission and bounded retries selected.
4. Allowlist privacy model selected for payload safety.
5. KPI reconciliation SLO and phased rollout strategy selected.

## Phase 1: Design & Contracts

### Data Model
- Defined in [data-model.md](C:/Users/dell/Documents/ScholarX/V2/web/specs/014-posthog-analytics-governance/data-model.md).
- Core entities: `EventDefinition`, `EventPropertyContract`, `EventPayload`, `AttributionContext`, `IdentityLinkRecord`, `KpiMapping`, `GovernanceChangeRecord`.

### Contracts
- Event contract: [contracts/event-dictionary.md](C:/Users/dell/Documents/ScholarX/V2/web/specs/014-posthog-analytics-governance/contracts/event-dictionary.md)
- KPI contract: [contracts/kpi-mapping.md](C:/Users/dell/Documents/ScholarX/V2/web/specs/014-posthog-analytics-governance/contracts/kpi-mapping.md)

### Quickstart
- Rollout and verification playbook: [quickstart.md](C:/Users/dell/Documents/ScholarX/V2/web/specs/014-posthog-analytics-governance/quickstart.md)

### Agent Context
- Updated `AGENTS.md` plan pointer to this feature's plan file.

## Phase 2: Implementation Strategy (for /speckit.tasks)

1. Foundation slice (contracts + wrappers)
- Implement strongly-typed event definitions and property contracts.
- Create analytics wrapper APIs for client and server emission.
- Add runtime validators and normalization utilities.

2. Website/funnel instrumentation slice
- Track `website_visit`, `cta_click`, `signup_started`, `signup_completed`, `first_value_action`.
- Ensure anonymous identity continuity and authenticated stitching.

3. Opportunity/search instrumentation slice
- Track `opportunity_view`, `opportunity_save`, `opportunity_apply_click`, `search_performed`, `ai_search_performed`.
- Apply safe-property transforms and bucketization rules.

4. Executive mirror slice
- Mirror only KPI-mapped events with strict safe subset.
- Preserve true-zero vs data-gap semantics in read models.

5. Quality and observability slice
- Add tests across unit/integration/e2e layers.
- Add delivery/completeness/reconciliation monitoring and alert thresholds.

6. Rollout slice
- Feature-flag gated activation by surface.
- Shadow verification period before full activation.

## Testing & Quality Gates

- Unit tests:
  - Schema validation and normalization
  - Forbidden property rejection
  - KPI mapping correctness
- Integration tests:
  - Client/server emission pathways
  - Internal mirror persistence and dedupe behavior
- E2E tests:
  - Public journey funnels and key CTA paths
  - Dashboard KPI reconciliation smoke checks
- Exit criteria:
  - P1 events instrumented and validated
  - Required-property completeness >= 95%
  - KPI variance <= 5% in agreed windows
  - Zero critical-flow failures due to analytics

## Operational Readiness

- Ownership model:
  - Each event has explicit owner team and change control process.
- Incident playbook:
  - Analytics outage defaults to fail-open; raise operational alert without blocking user requests.
- Governance cadence:
  - Weekly review during first month post-launch, then monthly.

## Post-Design Constitution Check

- Principle I: PASS (clear layered responsibilities)
- Principle II: PASS (strict event typing and validation)
- Principle III: PASS (multi-layer test strategy)
- Principle IV: PASS (non-blocking UX safety)
- Principle V: PASS (scalable, staged rollout and observability)

No violations introduced after design.

## Complexity Tracking

No constitution exceptions required.
