# Quickstart: Executive Dashboard Analytics

## Prerequisites

- Active branch: `012-executive-dashboard`
- Feature directory: `specs/012-executive-dashboard`
- Admin account available locally or in staging
- Database has existing admin/course/progress/email schema migrated
- Redis cache layer from spec 011 configured for staging/performance validation where available

## Implementation Order

1. Create executive contracts and schemas.
2. Add executive database schema and migrations.
3. Build metric registry, calculation policy, freshness service, redaction policy.
4. Build read repository and page services for Phase 1.
5. Build Action Center rules and persisted state repository.
6. Build export service and audit logging.
7. Add admin-only executive API routes.
8. Build shared executive UI primitives.
9. Build Phase 1 pages under `/admin/executive`.
10. Add tests and run validation commands.

## Local Verification Commands

```powershell
pnpm run typecheck
pnpm run lint
pnpm run test
node --import tsx --test src/domain/executive/**/*.test.ts
node --import tsx --test src/app/api/admin/executive/**/*.test.ts
```

## Manual Acceptance Checks

- Sign in as admin and open `/admin/executive`.
- Confirm Phase 1 navigation includes Overview, Users, Courses & Lessons, Learner Progress,
  Opportunities & AI, Technical Health, Action Center, and Public Website & Growth.
- Change date range and verify filters persist across pages.
- Confirm every section shows a freshness state.
- Confirm missing AI/website instrumentation appears as data-gap, not zero.
- Confirm Action Center shows derived items from seeded stalled learners/inquiries.
- Export Overview and verify filters, generated timestamp, freshness, and redaction notes.
- Attempt access as a non-admin user and verify denial.

## Metric Fixture Checks

Seed controlled data and verify:

- Heatmap peak hour matches inserted progress events.
- Critical-drop lesson appears only when the drop is greater than 20 percentage points.
- Active subscriptions exclude cancelled/refunded/expired records.
- Stalled learners are users with active subscription and no progress event in 14 days.
- Export totals match page totals for the same filters.

## Responsive / Accessibility Checks

Run screenshots or Playwright flows at:

- Desktop: 1280px width
- Tablet: 768px width
- Mobile: 375px width

Verify:

- No chart labels overlap or clip.
- Keyboard can reach filters, page navigation, section refresh, table controls, and export.
- Charts expose text summaries for assistive technology.
- Favorable/unfavorable trend is conveyed by text or icon as well as color.

## Rollout

1. Enable routes in staging for admins only.
2. Validate fixture totals against raw database queries.
3. Enable Overview and Technical Health for internal review.
4. Enable remaining Phase 1 pages after source data-gap states are verified.
5. Enable exports only after redaction tests pass.
6. Enable Phase 2 pages after ownership and finance source data are verified.

## Rollback

- Disable the executive workspace navigation entry/config flag.
- Keep API routes inaccessible through role/config gate.
- No operational admin CRUD is changed by rollback.
- Action Center state and analytics event tables can remain inert for forensic review.

## Implementation Validation Notes (2026-05-26)

- Type safety validation passed:
  - `pnpm exec tsc --noEmit --pretty false`
- Focused executive slice tests passed incrementally during implementation:
  - Management tables, event impact, content quality, finance, export, and fixture-backed unit suites.
  - Route contract suites for the same slices passed with admin/auth/flag/error-path checks.
- Browser coverage files are present for executive paths, including:
  - Overview, users, technical health, courses/lessons, opportunities/AI, action center, growth, finance, and export.
  - Accessibility and responsive smoke specs are included and guard on `EXECUTIVE_E2E_BASE_URL`.
- Environment caveat:
  - Without `EXECUTIVE_E2E_BASE_URL`, executive browser tests are intentionally skipped by design.
