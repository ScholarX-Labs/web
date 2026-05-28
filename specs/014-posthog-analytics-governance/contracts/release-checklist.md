# Analytics Contract Release Checklist

Complete this checklist before shipping analytics contract changes.

- [ ] Registry update completed in `src/lib/executive/analytics/event-registry.ts`.
- [ ] Required metadata present for every event (owner, description, schemaVersion, ingestion, mirrorEligible, piiClass).
- [ ] Route schema updated for `client_route` events.
- [ ] Mirror routing updated for mirror-eligible events.
- [ ] Privacy sanitizer and forbidden fields reviewed.
- [ ] KPI mapping reviewed for impacted growth/product metrics.
- [ ] Tests passed:
  - [ ] `pnpm run typecheck`
  - [ ] `pnpm run test`
  - [ ] `node --import tsx --test tests/e2e/**/*.spec.ts`
  - [ ] E2E tests passed for critical event flows (confirm signup path, opportunity actions path, and search event path; include `tests/e2e/analytics-opportunity-search.spec.ts` in the run).
- [ ] Change log entry completed from `change-log-template.md`.
- [ ] Rollout plan defined (flags, shadow mode, monitoring).
- [ ] Rollback plan documented.
