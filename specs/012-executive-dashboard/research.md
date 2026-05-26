# Research: Executive Dashboard Analytics

## Decision: Use a dedicated executive read-model domain

**Rationale**: The dashboard aggregates across users, courses, lessons, progress, subscriptions,
inquiries, certificates, email health, admin audit, opportunities, and optional website/AI events.
Keeping this in `src/domain/admin` would turn the admin CRUD module into a reporting monolith.
A dedicated `src/domain/executive` module creates a clear read boundary with its own contracts,
query services, freshness handling, redaction, and export behavior.

**Alternatives considered**:
- Extend `src/domain/admin`: simpler short-term, but mixes CRUD writes with analytics and risks more `any`.
- Build only page-local queries: fast to start, but duplicates metric definitions and breaks export consistency.
- External BI tool: useful later, but outside the current product workflow and export/access requirements.

## Decision: Centralize metric definitions in a registry

**Rationale**: The spec requires matching totals across KPI cards, drilldowns, and exports. A registry
for metric ids, labels, definitions, sensitivity, favorable direction, and chart intent prevents
copy/paste definitions and makes glossary/export metadata consistent.

**Alternatives considered**:
- Inline labels in components: easy but causes definition drift.
- Store all definitions in the database: flexible but unnecessary for static first-party metrics.

## Decision: Persist only Action Center workflow state, not every derived item

**Rationale**: Most action items are derived from current source data: stalled learners, SLA-breached
inquiries, expiring opportunities, failed emails, data freshness failures. Persisting all derived rows
creates synchronization and cleanup problems. Persist only `sourceKey`, status, owner, due date override,
dismissal/resolution state, and audit trail.

**Alternatives considered**:
- Store all generated items: easier table rendering, but stale duplicates become likely.
- Compute everything without persistence: no ownership/status tracking, which fails the spec.

## Decision: Use data-gap states for missing instrumentation

**Rationale**: AI search quality, website funnel analytics, opportunity apply clicks, and some team
operations metrics may not have event sources yet. Presenting zero would be false. The dashboard must
return a typed `data-gap` section with a clear source-unavailable message.

**Alternatives considered**:
- Hide unavailable sections: stakeholders cannot tell what is missing.
- Treat missing data as zero: misleading and explicitly rejected by the spec.

## Decision: Start with custom chart primitives using existing dependencies

**Rationale**: The project already has React, Tailwind, Framer Motion, and icons. The first implementation
can cover simple line, bar, funnel, heatmap, and accessible summaries with custom SVG/CSS primitives.
This avoids adding dependency weight until there is a measured gap.

**Alternatives considered**:
- Add Recharts immediately: faster chart authoring, but adds a dependency not currently present.
- Use canvas charts: more control, but harder to make accessible and responsive.

## Decision: Add narrowly scoped analytics event tables

**Rationale**: Some requirements need events that do not exist in durable business tables:
website CTA clicks, AI search events, opportunity apply clicks, link check results. A generic
analytics event table supports these without overfitting the schema to one dashboard page.

**Alternatives considered**:
- Add one table per event type: stronger typing, more migrations and overhead.
- Do not add instrumentation: many dashboard sections would remain permanent data gaps.

## Decision: Use short-lived admin-scoped aggregate caching

**Rationale**: Executive dashboards repeatedly read expensive aggregates. Short TTL caching for normalized
admin DTOs improves performance while keeping data freshness visible. Authenticated analytics cache entries
must never be public and must not include raw PII beyond authorized DTO shapes.

**Alternatives considered**:
- No cache: simpler but likely misses 3-second load goals as data grows.
- Long-lived cache: faster but increases stale-risk for leadership decisions.

## Decision: Separate exports from screen capture

**Rationale**: Board-ready snapshots should use print/PDF-ready HTML and structured CSV/table data built
from the same read service as the UI. Browser screenshots are fragile and not accessible. Exports must
include filters, generation timestamp, freshness, and redaction notes.

**Alternatives considered**:
- Screenshot the page: visually easy but brittle and hard to validate.
- CSV only: insufficient for board-ready summaries.

## Decision: Use route-level and domain-level authorization

**Rationale**: Admin layout checks protect pages, but APIs and exports need independent authorization and
redaction. The domain must know viewer permissions to shape DTOs correctly.

**Alternatives considered**:
- Page-only guard: API/export data can still leak if called directly.
- Middleware-only guard: not enough for role-specific redaction.
