# 🧱 ARCHITECTURE

## Layered Architecture

1. Presentation Layer
- `src/app/`, `src/components/`
- Handles rendering, interaction, navigation, route-level composition

2. Application Layer
- Route handlers and orchestration logic
- Coordinates auth, services, and policies

3. Domain Layer
- `src/domain/`
- Business logic, read-model builders, KPI semantics, policy objects

4. Data Layer
- `src/db/` + Drizzle repositories
- PostgreSQL persistence

5. Observability & Analytics Layer
- PostHog capture path via `/ingest/*`
- Internal mirror (`/api/analytics/events`) for selected events
- Event governance, validation, reconciliation

## Request Boundary Rules
- Public routes must not depend on authenticated-only logic
- Admin behaviors must remain isolated
- Client components must not import server-only modules

## Analytics Architecture
- Client boundary: `trackClientEvent`
- Server boundary: `trackServerEvent`
- Privacy filtering: forbidden-key sanitizer
- Mirroring policy: event-driven whitelist
- KPI alignment: mapping + reconciliation utilities

## Runtime Topology
- Browser ↔ Next.js standalone container on ACA
- App container ↔ PostgreSQL
- App/browser analytics ↔ PostHog (via same-origin proxy)
- CI/CD via GitHub Actions builds Docker image and deploys ACA revision

