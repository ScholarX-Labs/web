# 🏅 ENGINEERING_QUALITY

This document captures objective proof of engineering quality for ScholarX.

## 1) CI Status

Primary workflows:
- Web deploy/build: `.github/workflows/deploy-aca.yml`
- Worker deploy/build: `.github/workflows/deploy-worker-aca.yml`

Recommended badge setup:
- Add GitHub Actions status badges in README once default branch workflow is active.

## 2) Test Coverage Summary

Current strategy:
- Unit + integration tests via Node test runner (`pnpm test`)
- API-focused suite (`pnpm test:api`)
- E2E journey tests under `tests/e2e/`

Coverage reporting recommendation:
- Integrate Istanbul/c8 in CI and publish:
  - line coverage
  - branch coverage
  - critical-path coverage

## 3) E2E Test Documentation

Run E2E:
```bash
node --import tsx --test tests/e2e/**/*.spec.ts
```

Critical analytics E2E:
- `tests/e2e/analytics-opportunity-search.spec.ts`
- validates search + opportunity apply event emission path

## 4) Lint / Typecheck / Validation

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Release quality gate should require all green checks.

## 5) Release Tags & Changelog

- Tag format: `vMAJOR.MINOR.PATCH`
- Process: see `RELEASES.md`
- History and release notes: `CHANGELOG.md`

## 6) Planning Quality (GitHub Issues)

Use structured issue planning template:
- `.github/ISSUE_TEMPLATE/feature_request.md`

Each implementation issue should include:
- problem statement
- alternatives considered
- acceptance criteria
- rollout/monitoring plan

## 7) PR Decision Quality

Use `.github/pull_request_template.md` to document:
- design decisions
- tradeoffs
- alternatives rejected
- security checks
- rollout + rollback

## 8) Monitoring Evidence (Safe Screenshots)

Recommended dashboards/screenshots:
- Sentry error trends
- PostHog key event trends
- executive KPI panels (non-sensitive)

Do not expose:
- secrets
- user PII
- internal tokens
- raw credentials or host-level sensitive metadata

## 9) Performance Benchmarking

Benchmark protocol (recommended):
- Homepage initial load
- AI search first result latency
- Opportunity apply interaction latency
- Admin/executive API response p95

Store benchmark snapshots per release in release notes.

## 10) Accessibility Checks

Recommended checks:
- Keyboard-only navigation on core flows
- Visible focus states
- Color contrast checks
- Semantic landmark/heading structure
- Screen reader sanity pass on auth + opportunity flows

Automate where possible (axe/lighthouse CI) and attach results per major release.

