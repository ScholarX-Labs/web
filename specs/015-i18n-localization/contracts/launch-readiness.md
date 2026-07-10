# Contract: Launch Readiness Gates

**Version**: 1.0.0
**Owner**: Engineering Lead + Product
**Last Updated**: 2026-06-02

---

## Purpose

Define the required checks, procedures, rollback criteria, and post-launch operating rules before Arabic localization is enabled for broad user exposure. Arabic routes are functional before this gate — they are functional but not linked from the main navigation and not included in SEO outputs until all gates are PASS.

---

## Pre-Conditions

Before running launch gate validation:
1. All implementation phases (1–7) are complete.
2. Arabic translations are human-approved (`MessageCatalog.approvedAt` is set).
3. All Phase 8 (QA) tests pass in a non-production staging environment.
4. Performance baseline comparison is available (captured in Phase 1).
5. Sentry/observability is configured to receive localization gap reports.

---

## Launch Gate Checklist

Each gate must be evaluated and marked as one of: **PASS**, **FAIL**, or **DEFERRED** (with written justification for any DEFERRED item).

Arabic broad exposure requires **all gates at PASS**. No FAIL is acceptable. A DEFERRED gate requires written approval from the Engineering Lead and Product Owner, documenting the accepted risk and the resolution plan.

---

### Gate 1 — Route Inventory Completeness

**Required Result**: 100% of `src/app/**/page.tsx` routes are classified in `contracts/route-inventory.md`.

**How to validate**:
```bash
pnpm i18n:validate-routes
```

**PASS criteria**: Script exits 0. No unclassified routes.

**FAIL response**: Add missing routes to inventory with correct status before proceeding.

---

### Gate 2 — English Default Route Stability

**Required Result**: 100% of in-scope `localized` routes resolve correctly at their unprefixed English paths with no redirects.

**How to validate**:
- Playwright E2E: visit `/`, `/courses`, `/about`, `/auth/signin`, `/profile`, `/ai-search`, `/opportunities`, `/certificates` (authenticated), `/scholar/[username]`.
- Verify: HTTP 200, `<html lang>` = `en-US`, `<html dir>` = `ltr`, no `Location` redirect header.

**PASS criteria**: All routes return 200, correct lang/dir, no redirect.

**FAIL response**: Route regression — investigate middleware exclusion list and `[locale]` layout `notFound()` logic.

---

### Gate 3 — Arabic Route Availability

**Required Result**: 100% of `localized` routes in the inventory serve Arabic content at their `/ar`-prefixed paths.

**How to validate**:
- Playwright E2E: visit `/ar`, `/ar/courses`, `/ar/about`, `/ar/auth/signin`, `/ar/profile`, `/ar/ai-search`.
- Verify: HTTP 200, `<html lang>` = `ar-EG`, `<html dir>` = `rtl`, Arabic text in `<h1>`.

**PASS criteria**: All Arabic routes return 200, correct lang/dir, Arabic-locale content.

---

### Gate 4 — Unsupported Locale Prefix Safety

**Required Result**: 100% of requests with unsupported locale-like prefixes return 404. No redirects to valid locales. No unrelated content served.

**How to validate**:
```bash
# Each should return 404 status
curl -I https://[staging-url]/xyz/courses
curl -I https://[staging-url]/fr/courses
curl -I https://[staging-url]/de/about
curl -I https://[staging-url]/01/
```

**PASS criteria**: HTTP 404 for all. No 301/302. No content body from another route.

---

### Gate 5 — Translation Coverage

**Required Result**: `pnpm i18n:check` exits 0. 100% of required Arabic keys are present and non-stub across all namespaces required by `localized` routes.

**How to validate**:
```bash
pnpm i18n:check
```

**PASS criteria**: Script exits 0. Zero missing keys. Zero stub (`__NEEDS_TRANSLATION__`) values. Zero ICU syntax errors.

**FAIL response**: Missing keys are a release blocker. Work with translator to complete coverage.

---

### Gate 6 — Account Email Localization

**Required Result**: All 4 email templates (`email_verification_otp`, `signin_otp`, `password_reset`, `email_change`) produce correct English and Arabic outputs. Arabic outputs declare `dir="rtl"` and use Arabic text.

**How to validate**:
```bash
pnpm test -- tests/unit/email/
pnpm test -- tests/integration/email/
```

**Also validate manually**:
1. Create a test user account with `locale: 'ar'`.
2. Trigger each of the 4 email flows.
3. Confirm Arabic subject and body in the email inbox.
4. Confirm OTP code is presented in a `ltr` block within the RTL email.

**PASS criteria**: All unit and integration tests pass. Manual test confirms Arabic email delivery.

---

### Gate 7 — RTL Visual QA

**Required Result**: No release-blocking RTL visual defects on any supported viewport.

**Release-blocking defects** (any single defect fails this gate):
- Horizontal overflow on any Arabic page at any supported viewport.
- Text clipped to the point of unreadability.
- Interactive element (button, link, form field) inaccessible due to layout issue.
- Navigation or header renders incorrectly in RTL.
- Form step indicator flows in wrong direction.
- Directional icon (chevron, arrow) points in semantically incorrect direction.
- Auth flow visually broken (cannot identify the CTA button).

**How to validate**:
- Playwright visual regression snapshots at 375px, 768px, 1280px for: `/ar`, `/ar/courses`, `/ar/auth/signin`, `/ar/auth/signup`, course application form (all steps), language switcher in open state.
- Manual review by a tester with access to an Arabic-locale device (or browser locale override).

**PASS criteria**: All Playwright snapshots pass. Manual reviewer identifies zero release-blocking defects.

**Non-blocking defects**: Minor cosmetic issues (slightly suboptimal spacing, a single element with minor alignment imprecision) are documented as `user_visible` localization gaps for follow-up but do not block launch.

---

### Gate 8 — Accessibility QA

**Required Result**: No release-blocking accessibility defects on Arabic pages.

**Release-blocking defects**:
- `<html lang>` or `<html dir>` absent or incorrect on any Arabic page.
- Form fields without associated localized `<label>`.
- Validation error messages not announced by `aria-live` region.
- Language switcher buttons without accessible names.
- Focus order navigates in reverse or illogical sequence in Arabic forms.

**How to validate**:
```bash
pnpm playwright test tests/e2e/a11y/
# (axe-core integrated Playwright tests)
```

**PASS criteria**: Zero axe-core violations on Arabic pages. Manual focus-order check passes for sign-in and course application forms.

---

### Gate 9 — Access Boundary Check

**Required Result**: No regression in public/authenticated/admin access boundaries.

**How to validate**:
- Visit `/ar/profile` without auth → redirected to `/ar/auth/signin` (not shown empty profile).
- Visit `/ar/courses/[slug]/lessons` without auth → redirected to sign-in.
- Visit `/ar/admin/` → 404 or redirect to admin sign-in (not shown as a public Arabic page).
- Visit `/ar/api/courses` → 404 (API routes are not localized).

**PASS criteria**: All access boundaries unchanged. No Arabic route serves unauthenticated content that requires auth. No admin route is publicly accessible via Arabic prefix.

---

### Gate 10 — Metadata and Sitemap

**Required Result**: Only valid in-scope public localized pages appear in sitemap and hreflang. Out-of-scope pages are absent.

**How to validate**:
- Fetch `[staging-url]/sitemap.xml` and parse all URLs.
- Verify: all `localized` public routes appear with English and Arabic variants.
- Verify: admin, API, diagnostic, and `english_only` routes are absent.
- Inspect HTML source of each localized public page for `<link rel="alternate" hreflang>` tags.
- Verify `x-default` points to the English (unprefixed) path.

**PASS criteria**: Sitemap contains expected URLs only. All public localized pages have correct hreflang alternates.

---

### Gate 11 — Build and Test Gates

**Required Result**: All CI quality gates pass on the feature branch.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm i18n:check
pnpm i18n:validate-routes
pnpm build
```

**PASS criteria**: All commands exit 0. Zero TypeScript errors. Zero lint violations. Zero test failures.

---

### Gate 12 — Gap Reporting Operational

**Required Result**: The production localization gap reporting system is active and observable.

**How to validate**:
1. Temporarily remove one Arabic key from a non-critical namespace in the staging environment.
2. Visit the affected Arabic page.
3. Verify: page shows English fallback (not raw key).
4. Verify: Sentry/monitoring receives a `MISSING_TRANSLATION` gap record.
5. Verify: gap record does not contain OTP, reset URL, session token, or user email.
6. Restore the removed key.

**PASS criteria**: Fallback renders correctly. Gap record appears in monitoring. Gap record contains no private data.

---

## Gate Summary Table

| Gate | Status | Validated By | Date |
|------|--------|-------------|------|
| 1 — Route Inventory | `__` | | |
| 2 — English Stability | `__` | | |
| 3 — Arabic Availability | `__` | | |
| 4 — Unsupported Prefix | `__` | | |
| 5 — Translation Coverage | `__` | | |
| 6 — Email Localization | `__` | | |
| 7 — RTL Visual QA | `__` | | |
| 8 — Accessibility QA | `__` | | |
| 9 — Access Boundaries | `__` | | |
| 10 — Metadata & Sitemap | `__` | | |
| 11 — Build & Test Gates | `__` | | |
| 12 — Gap Reporting | `__` | | |

Arabic broad exposure MUST NOT be enabled until all 12 gates show `PASS`.

---

## Release Blockers

Any of the following triggers an immediate stop on Arabic exposure. It is not acceptable to ship around these:

1. **Missing required Arabic copy** for any in-scope surface.
2. **Arabic route serves private or unrelated content** (data boundary breach).
3. **Public route accidentally requires authentication** (access regression).
4. **Admin route becomes publicly accessible** via Arabic prefix.
5. **Account recovery or sign-in flow blocked** by any localization-related error.
6. **Raw message keys, internal IDs, secrets, session data, or stack traces** rendered to users.
7. **Major Arabic layout defects** that prevent task completion on any supported viewport.
8. **`pnpm build` failure** on the feature branch.

---

## Rollback Criteria and Procedure

If a critical issue is discovered after Arabic broad exposure is enabled:

**Trigger rollback when**:
- Any of the 7 Release Blockers above is observed in production.
- Error rate on any Arabic route exceeds 5% of requests.
- Critical journey (authentication, enrollment, certificate access) has a measurable failure rate.

**Rollback procedure** (in order):

1. **Immediate**: Disable Arabic navigation entry points — remove Arabic options from the language switcher by reverting the locale config to `['en']`. Arabic routes remain technically functional but users cannot navigate to them from the UI.
2. **Within 1 hour**: If the issue is in route middleware, expand the `isExcluded` list or set `NEXT_PUBLIC_I18N_ENABLED=false` env var to bypass locale middleware entirely.
3. **Do NOT**: Roll back the database migration (locale column) — it is backward-compatible and harmless with English-only routes.
4. **Do NOT**: Delete message files — keep them committed; a configuration change re-enables Arabic without re-translating.
5. **Communicate**: Post a status update to the relevant internal channel noting the issue, scope of impact, and ETA.
6. **Post-mortem**: Required within 48 hours of any Arabic rollback triggered by a Release Blocker.

---

## Post-Launch Operating Rules

### First 30 Days

- Monitor Sentry/observability dashboard for localization gap records daily.
- `user_visible` severity gaps triaged within **1 business day**.
- `release_blocker` severity gaps (if discovered post-launch) trigger the rollback procedure immediately.
- `warning` severity gaps triaged within **1 week**.
- Weekly report to Engineering Lead summarizing gap counts by type and status.

### Ongoing

- Any change to message files must be reviewed by the namespace owner (see `message-catalog.md`).
- Any new route added to the app must be added to the route inventory with a classification before the PR merges.
- Arabic translations for new features follow the same approval workflow as V2 translations.
- `pnpm i18n:check` and `pnpm i18n:validate-routes` remain required CI gates on every PR.
