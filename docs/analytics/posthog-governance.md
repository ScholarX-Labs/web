# PostHog Governance Playbook

## Purpose
Define how ScholarX introduces, changes, and validates analytics events safely across product and executive reporting.

## Source of Truth
- Event registry: `src/lib/executive/analytics/event-registry.ts`
- Route schema: `src/lib/executive/analytics/schemas.ts`
- Mirror policy: `src/lib/executive/analytics/mirror-routing.ts`
- KPI mapping: `src/lib/executive/analytics/kpi-mapping.ts`
- Contracts: `specs/014-posthog-analytics-governance/contracts/`

## Event Lifecycle
1. Propose event in spec with owner and KPI impact.
2. Add event constant and registry entry.
3. Define ingestion surface:
   - `client_route`: must be accepted by analytics route schema.
   - `client_direct`: PostHog-only unless explicitly mirrored later.
4. Set `mirrorEligible` and update mirror routing if true.
5. Add or update KPI mapping where relevant.
6. Add/adjust tests for registry completeness and contracts.
7. Validate in shadow mode before broad rollout.

## Privacy Rules
- Never emit secrets, tokens, session internals, or raw PII.
- Use categorical buckets for high-cardinality values when possible.
- Keep payloads operational and analytics-safe.

## Operational SLO Guidance
- Event delivery should be fail-open for user flows.
- Mirror writes should be non-blocking and observable via warning logs.
- KPI reconciliation variance target: within 5% for matched windows.

## Required Release Gate
Before merging analytics contract changes, complete:
- `specs/014-posthog-analytics-governance/contracts/release-checklist.md`
- `pnpm run typecheck`
- `pnpm run test`
