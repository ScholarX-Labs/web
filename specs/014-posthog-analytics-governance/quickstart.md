# Quickstart: PostHog Analytics Governance Rollout

## Goal
Enable production-grade, privacy-safe analytics tracking aligned with ScholarX executive KPIs.

## Prerequisites
- PostHog project configured and keys available in environment.
- Executive dashboard feature flags and analytics event table already available.
- Feature branch for this spec active.

## Step 1: Define canonical contracts
1. Create and review event dictionary contract.
2. Create KPI mapping contract for executive metrics.
3. Approve forbidden/allowed property policy.

## Step 2: Implement tracking boundary
1. Add typed analytics emission wrapper for client and server surfaces.
2. Add runtime validation and normalization at emission boundary.
3. Ensure fail-open behavior with bounded retries and non-blocking dispatch.

## Step 3: Instrument P1 surfaces
1. Public page visit tracking.
2. CTA click tracking for key acquisition paths.
3. Signup started/completed and first-value action tracking.
4. Opportunity apply action and AI/search core events.

## Step 4: Internal executive mirror
1. Mirror only KPI-mapped events into internal analytics store.
2. Enforce safe-property subset for mirrored payloads.
3. Add dedupe and data-gap/true-zero semantics.

## Step 5: Verification
1. Unit tests for schema validation, normalization, and forbidden property checks.
2. Integration tests for client/server event flows and mirror persistence.
3. E2E smoke checks for funnel journey and dashboard KPI reconciliation.

## Step 6: Rollout
1. Deploy in shadow mode for event quality checks.
2. Enable by feature flag per surface (public -> funnel -> opportunities/search).
3. Monitor delivery success, required-property completeness, and KPI variance.

## Step 7: Operate
1. Establish ownership and change-control workflow for event lifecycle.
2. Document event updates with effective dates and reporting impacts.
3. Review analytics SLOs weekly during first month.

## Validation Notes (E2E Quickstart)
Run these checks before rollout:
1. `pnpm run typecheck`
2. `pnpm run test`
3. Verify registry tests:
   - `src/lib/executive/analytics/__tests__/event-registry.test.ts`
   - `src/lib/executive/analytics/__tests__/contract-completeness.test.ts`
4. Confirm route schema accepts all `client_route` events and mirror policy matches registry flags.
5. Verify dashboard semantics:
   - Missing instrumentation renders `data_gap`.
   - Instrumented true-zero remains `ready` with zero values.
