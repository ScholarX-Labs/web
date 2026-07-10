# Quickstart: Production Internationalization and Arabic Localization

**Revised**: 2026-06-02

This is the engineer's day-one guide. Each step maps to a plan phase. Complete steps in order — the phases have hard dependencies.

---

## 0. Before You Start

Capture performance and bundle baselines **before any code changes**:

```bash
# SSR latency baseline (run in staging, save output)
curl -w "@curl-timing.txt" -s -o /dev/null https://[staging]/
curl -w "@curl-timing.txt" -s -o /dev/null https://[staging]/courses

# Bundle baseline
pnpm build && pnpm analyze
# Note the JS payload size for the home and courses pages
```

Confirm `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all pass on the current `main` branch.

---

## 1. Install and Configure Foundation (Phase 1)

```bash
pnpm add next-intl
```

Create these files in order (each depends on the previous):

### Step 1a — Locale constants (the single source of truth)
```
src/lib/i18n/locales.ts
```
→ Contains `SUPPORTED_LOCALES`, `Locale` type, `LocaleConfig`, `LOCALE_CONFIG`, `isLocale()`, `getDir()`, `isRTL()`.
→ Every other file in `src/lib/i18n/` imports from here. No locale string literals anywhere else.

### Step 1b — Routing config
```
src/lib/i18n/routing.ts
```
→ `defineRouting({ locales: SUPPORTED_LOCALES, defaultLocale: DEFAULT_LOCALE, localePrefix: 'as-needed' })`

### Step 1c — Navigation helpers
```
src/lib/i18n/navigation.ts
```
→ `createNavigation(routing)` — exports `Link`, `redirect`, `useRouter`, `usePathname`.
→ All internal links in localized pages use this `Link`, not `next/link`.

### Step 1d — Message loading
```
src/lib/i18n/messages.ts
```
→ `getRequestConfig()` with per-namespace dynamic imports.

### Step 1e — Direction hook
```
src/lib/i18n/direction.ts
```
→ `useDirection()`, `useIsRTL()` for client components.

### Step 1f — Plugin in next.config.ts
```typescript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/lib/i18n/messages.ts');
export default withNextIntl(nextConfig);
```

### Step 1g — Global type declaration
```
src/types/next-intl.d.ts
```
→ Extends `IntlMessages` interface with all namespace types derived from English JSON files.

**Validation**: `pnpm typecheck` passes. `pnpm build` passes.

---

## 2. Migrate Routes (Phase 2)

### Step 2a — Create middleware
```
src/middleware.ts
```
→ `createMiddleware(routing)` with explicit exclusion list for `admin`, `api`, `ingest`, `_next`, static files.
→ Test: `curl -I [local]/admin/` must NOT go through locale middleware.

### Step 2b — Create locale layout
```
src/app/[locale]/layout.tsx
```
→ Validates locale with `notFound()` for invalid values.
→ Sets `<html lang={bcp47Tag} dir={dir}>`.
→ Loads Inter (EN) and Noto Sans Arabic (AR) fonts conditionally.

### Step 2c — Migrate routes in batches (A → B → C → D → E)

**After each batch**:
```bash
# Spot-check the migrated routes
pnpm dev
# English still works:  curl -I http://localhost:3000/courses  → 200, lang=en-US
# Arabic now works:     curl -I http://localhost:3000/ar/courses → 200, lang=ar-EG
# Bad locale is 404:    curl -I http://localhost:3000/xyz/courses → 404
# Admin untouched:      curl -I http://localhost:3000/admin → 200 or 401 (not locale-affected)
```

**Phase 2 exit gate**: Run full validation above for all migrated routes. `pnpm typecheck && pnpm lint && pnpm build` pass.

---

## 3. Extract Messages (Phase 3)

### Step 3a — Create English message files (P0 first)

Start with the highest-impact namespaces:
```
src/messages/en/common.json    ← navigation, buttons, locale switcher
src/messages/en/auth.json      ← sign-in, sign-up, validation errors
src/messages/en/home.json      ← home page content
src/messages/en/courses.json   ← course UI, application form, enrollment
src/messages/en/email.json     ← transactional email subjects and bodies
```

Then P1:
```
src/messages/en/about.json
src/messages/en/opportunities.json
src/messages/en/certificates.json
src/messages/en/profile.json
src/messages/en/aiSearch.json
src/messages/en/metadata.json
src/messages/en/contact.json
```

### Step 3b — Create Arabic stub files

For each English file, create the matching Arabic file with stub values:
```bash
# Quick stub creation for all namespaces
cp src/messages/en/common.json src/messages/ar/common.json
# Then replace all values with "__NEEDS_TRANSLATION__"
```

### Step 3c — Replace hardcoded strings in components

**Server Component pattern**:
```typescript
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('courses');
return <h1>{t('hero.title')}</h1>;
```

**Client Component pattern**:
```typescript
'use client';
import { useTranslations } from 'next-intl';
const t = useTranslations('courses.enrollment');
return <Button>{t('buttonLabel')}</Button>;
```

### Step 3d — Create and run coverage check

```bash
# Create scripts/check-translations.ts (see plan.md §3.4)
pnpm i18n:check
# Expected: FAIL with list of missing/stub keys — this is correct at this stage
```

Send the English `src/messages/en/*.json` files to translators.

**Phase 3 exit gate**: All P0+P1 strings extracted. `pnpm typecheck` passes. Coverage check identifies all stub keys (expected FAIL — will become PASS when translations arrive).

---

## 4. RTL and Typography (Phase 4)

### Step 4a — Global CSS Arabic rules

Add to `src/app/globals.css`:
```css
:lang(ar) {
  --font-body: var(--font-arabic);
  font-feature-settings: normal;
  line-height: 1.8;
  letter-spacing: 0;
}
:lang(ar) h1, :lang(ar) h2, :lang(ar) h3 { font-weight: 600; }
:lang(ar) input, :lang(ar) textarea { text-align: start; }
```

### Step 4b — Audit and fix physical Tailwind classes

Run the audit grep (from `plan.md §4.2`). Fix all violations in components inside `src/app/[locale]/` and shared components. Use the physical → logical property mapping table.

### Step 4c — Fix directional icons

Every chevron, arrow, or directional icon that means "forward" or "next":
```html
<ChevronRightIcon className="rtl:rotate-180" />
```

### Step 4d — Fix Framer Motion x-offsets

```typescript
const x = useRTLMotionX(-100); // sign flips in RTL
```

**Phase 4 exit gate**: Take Playwright screenshots of `/ar` and `/ar/courses` at 375px and 1280px. No horizontal overflow. Directional icons correct. Navigation reads RTL.

---

## 5. Preference Persistence (Phase 5)

### Step 5a — Database migration

```bash
# Add locale column to auth-schema.ts first
pnpm db:generate  # Creates new migration file
pnpm db:migrate   # Applies migration
```

### Step 5b — Preference update API

Create `src/app/api/v1/me/locale/route.ts` (see plan.md §5.2).

**Test immediately**:
```bash
# Authenticated request — should return 200
curl -X PATCH http://localhost:3000/api/v1/me/locale \
  -H "Content-Type: application/json" \
  -b "session=..." \
  -d '{"locale":"ar"}'

# Unauthenticated — must return 401
curl -X PATCH http://localhost:3000/api/v1/me/locale \
  -H "Content-Type: application/json" \
  -d '{"locale":"ar"}'

# Invalid locale — must return 400
curl -X PATCH http://localhost:3000/api/v1/me/locale \
  -H "Content-Type: application/json" \
  -b "session=..." \
  -d '{"locale":"<script>alert(1)</script>"}'
```

### Step 5c — Language switcher component

Create `src/components/locale-switcher.tsx` (see plan.md §5.3).

Add to desktop header and mobile navigation.

**Phase 5 exit gate**: Language switcher visible in header. Switch en→ar navigates to `/ar/...`. Switch ar→en navigates to unprefixed `/...`. Preference API returns 401 for unauthenticated requests.

---

## 6. Email Templates (Phase 6)

### Step 6a — Create template infrastructure

```
src/lib/email/templates/base.ts         ← buildEmailHtml() with escapeHtml()
src/lib/email/templates/verification.ts
src/lib/email/templates/signin-otp.ts
src/lib/email/templates/password-reset.ts
src/lib/email/templates/email-change.ts
src/lib/email/send.ts                   ← resolveEmailLocale()
```

### Step 6b — Update auth.ts

Replace the 4 hardcoded email blocks in `src/lib/auth.ts` with calls to the new template functions:

```typescript
// BEFORE
subject: 'Your ScholarX email verification code',
text: `Your verification code is ${value}. It expires in 10 minutes.`,

// AFTER
const locale = await resolveEmailLocale(user?.id, journeyLocale);
const { subject, text, html } = verificationEmail(locale, { otp: value, expiryMinutes: 10 });
```

### Step 6c — Test

```bash
pnpm test tests/unit/email/
pnpm test:api tests/integration/email/
```

**Manual**: Trigger sign-up with Arabic locale in the browser. Confirm Arabic subject in email inbox.

**Phase 6 exit gate**: All 4 email types pass unit tests in English and Arabic. Arabic email has `dir="rtl"`. OTP not in server logs.

---

## 7. SEO (Phase 7)

### Step 7a — Page metadata

For each public localized page, update `generateMetadata()` to use `generateLocalizedMetadata()` from `src/lib/i18n/metadata.ts`.

### Step 7b — Sitemap

Update `src/app/sitemap.ts` to iterate over `routing.locales` and generate entries for all public localized routes only.

**Phase 7 exit gate**: View source on `/ar/courses` — `<link rel="alternate" hreflang="en">` and `hreflang="ar"` present. Fetch `/sitemap.xml` — `/admin` routes absent.

---

## 8. Final QA and Launch Gates (Phase 8 & 9)

### When Arabic translations arrive (human-approved)

1. Replace all `__NEEDS_TRANSLATION__` stub values with Arabic translations.
2. Run `pnpm i18n:check` — must exit 0.
3. Run Playwright tests: `pnpm playwright test tests/e2e/i18n/`.
4. Run visual regression snapshots.
5. Complete launch gate checklist in `contracts/launch-readiness.md`.
6. Enable Arabic in navigation when all 12 gates are PASS.

### Validation Commands (Full Suite)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm i18n:check
pnpm i18n:validate-routes
pnpm build
pnpm playwright test tests/e2e/i18n/
pnpm playwright test tests/e2e/a11y/
```

---

## Common Pitfalls

| Pitfall | Prevention |
|---------|-----------|
| Using `next/link` instead of `@/lib/i18n/navigation`'s `Link` | ESLint rule: no-restricted-imports for `next/link` in `src/app/[locale]` |
| Using `ml-4` in RTL-capable component | RTL Tailwind audit (plan.md §4.2) + ESLint tailwindcss plugin |
| Calling `useTranslations()` in a Server Component | TypeScript error — `useTranslations` is client-only |
| Missing `await` on `getTranslations()` | TypeScript error — it returns a Promise |
| Hardcoded locale string `'en'` or `'ar'` outside `locales.ts` | Code review + grep for string literals |
| OTP value appearing in a catch block log | Unit test: verify catch paths in template functions don't log `otp` |
| `lang` attribute on `<html>` still hardcoded `"en"` | Root layout review — the `[locale]/layout.tsx` sets this dynamically; root `layout.tsx` must not set it |
| Forgetting to call `setRequestLocale(locale)` in `[locale]/layout.tsx` | `next-intl` will warn at build time |
