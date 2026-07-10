# ScholarX V2 — Internationalization (i18n) Specification

**Author:** Principal SWE  
**Status:** DRAFT  
**Target Release:** V2 (GA)  
**Supported Locales — V2:** `en` (English), `ar` (Arabic)  
**Planned — V3+:** `fr` (French), `de` (German)  
**Date:** 2026-06-01

---

## 1. Problem Statement

ScholarX V2 is English-only. All user-facing text is hardcoded in components, data files, and email templates. The `<html>` element has `lang="en"` hardcoded, fonts load only Latin subsets, and no RTL layout support exists.

Arabic is the highest-priority second language: it is RTL, has its own script, and requires a dedicated Arabic font. French and German are LTR, share the Latin script, and are therefore lower-complexity additions.

This spec covers: the architectural approach, library selection rationale, URL strategy, RTL/bidirectionality, font loading, database changes, email localization, admin tooling, and a phased delivery plan.

---

## 2. Non-Goals

- **Machine translation.** All strings are human-translated before shipping.
- **Admin dashboard translation (V2).** Admin is internal tooling; English-only is acceptable for V2. Internationalize in V3.
- **Per-course locale variants.** Course content (titles, descriptions) stored in the database may be multilingual but the database schema for that is out of scope here; content translation is a separate workstream.
- **Right-to-left support for the admin dashboard (V2).** Admin users are internal; deferred.
- **Locale-aware number/date/currency formatting beyond what `Intl` provides.** No custom formatters; use browser `Intl` API throughout.

---

## 3. Guiding Principles

1. **URL is the source of truth for locale.** `/ar/courses` and `/en/courses` are distinct, independently cacheable, SEO-indexable URLs. No cookie-only or Accept-Language-only routing.
2. **Default locale (`en`) has no prefix.** `/courses` is English. `/ar/courses` is Arabic. This matches Google's i18n URL best practice and avoids breaking existing links.
3. **RSC-first.** Translation lookups happen in React Server Components wherever possible. Client components receive translated strings as props; they do not call translation hooks for static strings.
4. **Type-safe messages.** The translation key type is derived from the English message file at build time. A missing key is a TypeScript error, not a runtime `undefined`.
5. **Zero bundle cost for unused locales.** Each locale's message bundle is loaded only for users browsing that locale. Dynamic import, never bundled together.
6. **Graceful fallback.** A missing translation key falls back to English silently in production. In development it throws to force the developer to add the translation.
7. **Accessibility first.** `<html lang>` and `<html dir>` are always set correctly. Screen readers and browser spellcheck work correctly for every locale.

---

## 4. Library Selection

### Decision: `next-intl` v4

| Criterion | `next-intl` | `react-i18next` | `lingui` |
|-----------|-------------|-----------------|---------|
| Next.js App Router native | **Yes (first-class)** | Workarounds required | Partial |
| RSC support (no `"use client"`) | **Yes** | No | No |
| Middleware locale detection | **Built-in** | Manual | Manual |
| Type-safe keys (no codegen) | **Yes** | No | Codegen required |
| ICU message format | **Yes** | Yes | Yes |
| Bundle size per locale | **Dynamic import** | Manual | Manual |
| RTL utilities | Locale metadata | Manual | Manual |
| Maturity / community | **High** | Very High | Medium |

`next-intl` is the correct choice for a Next.js 16 App Router project. It is the only library with first-class RSC support and built-in middleware routing.

**Package to install:**
```
pnpm add next-intl
```

---

## 5. URL Architecture

### Locale Prefix Strategy: `as-needed` (default locale unprefixed)

```
/                    → English home          (locale: en)
/courses             → English courses
/ar                  → Arabic home           (locale: ar)
/ar/courses          → Arabic courses
```

### Future Locales (V3+)
```
/fr/courses          → French courses
/de/courses          → German courses
```

### Routing Middleware

A Next.js middleware (`src/middleware.ts`) intercepts all requests and:

1. Detects locale from the URL prefix.
2. Falls back to `Accept-Language` header if no prefix is present and the user's browser prefers Arabic.
3. Persists the user's explicit choice in a `NEXT_LOCALE` cookie (1-year expiry).
4. Sets `x-locale` response header for CDN Vary caching.
5. Issues a 307 redirect only when the detected locale differs from the URL prefix and the user has an explicit cookie preference.

**No redirect for default locale.** A user browsing `/courses` stays at `/courses` regardless of browser language. Redirects only happen when the user explicitly switches.

### Route Group Restructure

Current layout has `src/app/(platform)/`. The i18n refactor wraps this in a locale segment:

```
src/app/
├── [locale]/                     ← NEW dynamic segment
│   ├── (platform)/
│   │   ├── courses/
│   │   ├── certificates/
│   │   └── opportunities/
│   ├── auth/
│   ├── ai-search/
│   ├── about/
│   ├── contact/
│   ├── profile/
│   ├── scholar/[username]/
│   └── page.tsx                  ← home
├── admin/                        ← NOT localized in V2
├── api/                          ← NOT localized
└── middleware.ts                 ← locale detection + routing
```

The `[locale]` segment is validated against the allowed list in middleware. An invalid segment (e.g., `/xyz/courses`) is treated as a 404, not a locale match.

---

## 6. Message File Structure

### Directory Layout

```
src/messages/
├── en/
│   ├── common.json       ← shared: navigation, buttons, errors
│   ├── home.json
│   ├── courses.json
│   ├── certificates.json
│   ├── opportunities.json
│   ├── auth.json
│   ├── profile.json
│   ├── about.json
│   ├── contact.json
│   ├── ai-search.json
│   └── email.json        ← transactional email templates
└── ar/
    ├── common.json
    ├── home.json
    ├── courses.json
    ├── certificates.json
    ├── opportunities.json
    ├── auth.json
    ├── profile.json
    ├── about.json
    ├── contact.json
    ├── ai-search.json
    └── email.json
```

### Message Key Convention

Keys are `camelCase`, namespaced by feature. Nested objects allowed up to 2 levels.

```jsonc
// src/messages/en/courses.json
{
  "hero": {
    "title": "Explore Our Courses",
    "subtitle": "Learn from world-class instructors"
  },
  "enrollment": {
    "buttonLabel": "Enroll Now",
    "processing": {
      "validating": "Validating enrollment",
      "preparing": "Preparing your learning space",
      "securing": "Securing access"
    },
    "successMessage": "You are now enrolled in {courseName}",
    "errorMessage": "Enrollment failed. Please try again."
  },
  "applicationForm": {
    "steps": {
      "personal": "Personal Information",
      "education": "Education",
      "motivation": "Motivation",
      "review": "Review"
    }
  }
}
```

```jsonc
// src/messages/ar/courses.json
{
  "hero": {
    "title": "استكشف دوراتنا",
    "subtitle": "تعلم من أفضل المدربين في العالم"
  },
  "enrollment": {
    "buttonLabel": "سجل الآن",
    "processing": {
      "validating": "جاري التحقق من التسجيل",
      "preparing": "جاري تجهيز مساحة التعلم الخاصة بك",
      "securing": "جاري تأمين الوصول"
    },
    "successMessage": "أنت مسجل الآن في {courseName}",
    "errorMessage": "فشل التسجيل. يرجى المحاولة مرة أخرى."
  },
  "applicationForm": {
    "steps": {
      "personal": "المعلومات الشخصية",
      "education": "التعليم",
      "motivation": "الدوافع",
      "review": "المراجعة"
    }
  }
}
```

### ICU Plurals and Interpolation

Use ICU message format for:
- **Plurals:** `{count, plural, one {# course} other {# courses}}`
- **Interpolation:** `"Welcome back, {name}"`
- **Select:** `{gender, select, male {his} female {her} other {their}}`

`next-intl` supports ICU natively.

---

## 7. TypeScript Integration

### Type-Safe Keys

```typescript
// src/lib/i18n/types.ts  (auto-derived, never written manually)
// next-intl generates this from the en/ messages at build time
// A key like t('courses.hero.typo') is a TS error.
```

Configure in `next-intl.config.ts`:
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});
```

### Usage in Server Components

```typescript
// src/app/[locale]/(platform)/courses/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function CoursesPage() {
  const t = await getTranslations('courses');
  return <h1>{t('hero.title')}</h1>;
}
```

### Usage in Client Components

```typescript
// src/components/courses/enroll-modal.tsx  ("use client")
import { useTranslations } from 'next-intl';

export function EnrollModal() {
  const t = useTranslations('courses.enrollment');
  return <Button>{t('buttonLabel')}</Button>;
}
```

**Rule:** Client components that need translations receive a pre-translated string as a prop when the parent is a Server Component. Only use `useTranslations` in client components that are genuinely dynamic (locale can change without a page reload — e.g., a language switcher preview).

---

## 8. RTL / Bidirectionality

Arabic is RTL. This is not cosmetic; it requires layout mirroring.

### HTML Direction Attribute

`src/app/[locale]/layout.tsx` sets `dir` and `lang` dynamically:

```typescript
const localeConfig = {
  en: { dir: 'ltr', lang: 'en' },
  ar: { dir: 'rtl', lang: 'ar' },
  fr: { dir: 'ltr', lang: 'fr' },
  de: { dir: 'ltr', lang: 'de' },
} as const;

export default function LocaleLayout({ children, params: { locale } }) {
  const { dir, lang } = localeConfig[locale];
  return (
    <html lang={lang} dir={dir}>
      ...
    </html>
  );
}
```

### Tailwind CSS RTL Utilities

Tailwind CSS 4 supports `rtl:` and `ltr:` variant modifiers natively.

**Mandatory conventions for any element that has directional layout:**

```html
<!-- margins -->
<div class="ms-4 me-2">          <!-- logical: margin-inline-start/end -->

<!-- padding -->
<div class="ps-6 pe-4">          <!-- logical: padding-inline-start/end -->

<!-- text alignment -->
<p class="text-start">           <!-- resolves to left in LTR, right in RTL -->

<!-- icons that need flipping -->
<ChevronRightIcon class="rtl:rotate-180" />

<!-- flex direction -->
<div class="flex flex-row rtl:flex-row-reverse">
```

**Banned in new code (for components that must be RTL-compatible):**
- `ml-*`, `mr-*` → replace with `ms-*`, `me-*`
- `pl-*`, `pr-*` → replace with `ps-*`, `pe-*`
- `text-left`, `text-right` → replace with `text-start`, `text-end`
- `left-*`, `right-*` for positioned elements → use `start-*`, `end-*`

A Tailwind custom plugin enforces logical properties via ESLint (`eslint-plugin-tailwindcss` with RTL rules).

### Absolute/Fixed Positioned Elements

All dropdown menus, tooltips, modals, and popovers use Radix UI Popper, which reads the document direction automatically. No manual overrides required.

### Animations

Framer Motion `x` offset animations must flip sign in RTL:

```typescript
const dir = useDirection(); // 'ltr' | 'rtl'
const x = dir === 'rtl' ? 100 : -100;
motion.div({ initial: { x }, animate: { x: 0 } });
```

A shared `useDirection()` hook reads `document.documentElement.dir`.

---

## 9. Font Strategy

### Font Loading — `src/app/[locale]/layout.tsx`

| Locale | Primary Font | Fallback | Script |
|--------|-------------|----------|--------|
| `en` | Inter | system-ui | Latin |
| `ar` | Noto Sans Arabic | system-ui | Arabic + Latin |
| `fr` | Inter | system-ui | Latin |
| `de` | Inter | system-ui | Latin |

```typescript
import { Inter, Noto_Sans_Arabic } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});
```

**CSS application:**

```css
/* globals.css */
:root {
  --font-body: var(--font-sans);
}

:lang(ar) {
  --font-body: var(--font-arabic);
  font-feature-settings: normal; /* disable Latin-specific features */
  line-height: 1.8;              /* Arabic text needs more line height */
  letter-spacing: 0;             /* Arabic has no letter-spacing */
}

body {
  font-family: var(--font-body), system-ui;
}
```

**Why Noto Sans Arabic:** It covers the full Unicode Arabic block, has excellent rendering on all platforms, is available on Google Fonts (zero hosting cost), and pairs visually with Inter for mixed Arabic/English content.

### Font Weight Mapping

Arabic display fonts are typically lighter-weight than their Latin equivalents. Use `font-medium` (500) where Latin uses `font-bold` (700) for headings to maintain visual weight parity.

---

## 10. Database Schema Changes

### 10.1 User Locale Preference

Add a `locale` column to the `user` table:

```sql
ALTER TABLE "user" ADD COLUMN "locale" TEXT DEFAULT 'en';
```

Drizzle migration:
```typescript
// src/db/schema/auth-schema.ts
locale: text("locale").default("en"),
```

**Values:** `'en'` | `'ar'` — validated at the application layer against the supported locales list. Not a DB enum so adding new locales requires no schema migration.

### 10.2 Course Content (Deferred to V3)

Course titles, descriptions, and lesson content will require a `course_translations` join table. This is explicitly out of scope for V2. V2 displays English content to all locales for course content.

```
course_translations (V3+)
  course_id   FK → courses.id
  locale      TEXT  ('en', 'ar', 'fr', 'de')
  title       TEXT
  description TEXT
  slug        TEXT  UNIQUE per locale
  PRIMARY KEY (course_id, locale)
```

### 10.3 Existing Arabic Name Fields

`first_name_ar` and `last_name_ar` already exist in `auth-schema.ts`. The profile page should display Arabic name when `locale = 'ar'`.

---

## 11. Email Localization

### Current State

Email templates are hardcoded English strings in `src/lib/auth.ts` lines 94–146.

### Target Architecture

```
src/lib/email/
├── templates/
│   ├── verification-code.ts   ← locale-aware template function
│   ├── signin-otp.ts
│   ├── password-reset.ts
│   └── email-change.ts
└── send.ts                    ← wrapper: resolves locale, picks template
```

Each template is a function `(locale: Locale, data: TemplateData) => { subject: string; html: string; text: string }`:

```typescript
// src/lib/email/templates/verification-code.ts
import en from '@/messages/en/email.json';
import ar from '@/messages/ar/email.json';

const messages = { en, ar } as const;

export function verificationCodeEmail(locale: 'en' | 'ar', code: string) {
  const m = messages[locale].verification;
  return {
    subject: m.subject,
    html: buildHtml({ locale, title: m.title, body: m.body.replace('{code}', code) }),
    text: m.body.replace('{code}', code),
  };
}
```

The HTML wrapper (`buildHtml`) sets `dir` and `lang` on the email `<html>` element and loads the correct font fallback stack for Arabic mail clients.

### Locale Resolution for Emails

When sending a transactional email, resolve locale in this priority order:
1. User's `locale` column from the database (if user is authenticated).
2. Locale passed explicitly by the caller (e.g., from URL context during sign-up).
3. Default: `'en'`.

```typescript
// src/lib/auth.ts  (updated sendVerificationCode)
const locale = user?.locale ?? 'en';
await sendEmail(verificationCodeEmail(locale, code));
```

---

## 12. Language Switcher UI

### Placement

- **Desktop header:** locale toggle button in the nav, top-right (or top-left for Arabic layout). Displays current locale as a flag + short label (`EN` / `عر`).
- **Mobile:** inside the hamburger menu.
- **Auth pages:** footer link.

### Behavior

1. Clicking a locale option navigates to the locale-prefixed equivalent of the current page (`/ar/courses` → `/courses` or `/ar/courses` → `/fr/courses`).
2. Sets `NEXT_LOCALE` cookie (1-year expiry) for persistence.
3. Saves locale preference to the user's database record if authenticated (via `PATCH /api/v1/me` with `{ locale }`).
4. No full page reload required — `next-intl` + `next/navigation` `useRouter().replace()` handles it.

### Component

```typescript
// src/components/locale-switcher.tsx  ("use client")
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next-intl/navigation';

const locales = [
  { code: 'en', label: 'EN', nativeLabel: 'English' },
  { code: 'ar', label: 'عر', nativeLabel: 'العربية' },
] as const;
```

---

## 13. SEO & Metadata

### `hreflang` Tags

`generateMetadata` in each page exports alternate URLs:

```typescript
export async function generateMetadata({ params: { locale } }) {
  return {
    alternates: {
      languages: {
        'en': '/courses',
        'ar': '/ar/courses',
        'x-default': '/courses',
      },
    },
  };
}
```

### Sitemap

`src/app/sitemap.ts` generates entries for all locale variants:

```typescript
const locales = ['en', 'ar'];
const routes = ['/courses', '/about', '/contact', ...];

return locales.flatMap(locale =>
  routes.map(route => ({
    url: locale === 'en' ? route : `/${locale}${route}`,
    alternates: { languages: { en: route, ar: `/ar${route}` } },
  }))
);
```

### Open Graph

OG metadata uses the locale-appropriate title and description from the message file.

---

## 14. Middleware Implementation

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all routes except API, static assets, and _next
    '/((?!api|_next|admin|ingest|.*\\..*).*)',
  ],
};
```

**Admin routes are excluded from locale middleware.** Admin stays at `/admin/*` without a locale prefix.

---

## 15. Migration Plan — Existing Text

### Phase 1 Extraction (prerequisite for V2 launch)

All hardcoded strings must be extracted to `src/messages/en/` before Arabic translation can begin.

Priority order by user impact:

| Priority | Files | Namespace |
|----------|-------|-----------|
| P0 | `src/lib/home-data.ts` | `home.json` |
| P0 | `src/components/ui/sign-in-card-2.tsx` | `auth.json` |
| P0 | `src/components/courses/course-application-form.tsx` | `courses.json` |
| P0 | `src/lib/auth.ts` (email templates) | `email.json` |
| P1 | `src/app/about/constants.ts` | `about.json` |
| P1 | `src/components/courses/enroll-modal.tsx` | `courses.json` |
| P1 | `src/components/ai-search/*.tsx` | `ai-search.json` |
| P2 | All remaining components | respective namespaces |

### Phase 2 Arabic Translation

Human translators receive the complete `en/` message files. Translation keys and structure are stable before translation begins.

**Translation workflow:**
1. English string freeze (no new keys during active translation).
2. Translator delivers `ar/` JSON files.
3. Automated check: `pnpm i18n:check` verifies all English keys exist in Arabic.
4. QA pass on Arabic UI (visual RTL check, copy review).
5. Ship.

---

## 16. Environment Configuration

Add to `src/config/env.ts`:

```typescript
// No new env vars required for V2.
// Locale list is hardcoded in src/lib/i18n/routing.ts.
// To add a locale in V3+ update routing.ts and add message files.
```

Feature flag for gradual rollout (optional):

```typescript
NEXT_PUBLIC_I18N_ENABLED: z.enum(['true', 'false']).default('false'),
```

Set to `'true'` once Arabic translations are complete and QA'd.

---

## 17. Testing Requirements

### Unit Tests

- `t('key')` returns expected string for each locale.
- Locale detection logic in middleware (mock request headers).
- `verificationCodeEmail('ar', '123456')` returns Arabic subject and body.
- `dir` attribute is `'rtl'` for locale `'ar'`, `'ltr'` otherwise.

### Integration Tests

- Language switcher navigates to `/ar/*` and sets `NEXT_LOCALE` cookie.
- Arabic user receives Arabic email (mock email service).
- User with `locale: 'ar'` in DB sees Arabic on login.

### Visual Regression

- Playwright screenshot tests for homepage, courses page, and auth flow in both `en` and `ar` locales.
- RTL layout checks: nav direction, form alignment, button placement.

### Lint Rules

Add ESLint rules to catch:
- Hardcoded user-facing strings (custom rule: string literal in JSX that is not a key).
- `ml-*`/`mr-*`/`pl-*`/`pr-*` Tailwind classes in components (enforce logical properties).

---

## 18. Performance Considerations

### Message Bundle Splitting

`next-intl` loads only the messages for the active locale. Arabic and English bundles never load together.

Each namespace (JSON file) is loaded only for the pages that use it. A user on `/ar/courses` loads only `ar/common.json` + `ar/courses.json`, not the full Arabic message set.

### CDN Cache Differentiation

Edge cache must vary on locale. Set `Vary: Accept-Language` and use locale-prefixed URLs (already handled by the URL strategy). No cookie-based cache variance needed.

### Font Loading Performance

`Noto_Sans_Arabic` is loaded with `display: 'swap'` and `preload: true` for the `ar` locale layout only. Latin pages never download the Arabic font.

---

## 19. Delivery Plan

### V2 Milestones

| Milestone | Scope | Owner |
|-----------|-------|-------|
| **M1** — Architecture | next-intl install, routing setup, middleware, `[locale]` segment, TypeScript types | 1 engineer, 3 days |
| **M2** — Extraction | All P0+P1 strings extracted to `en/` messages, components updated to use `t()` | 1 engineer, 5 days |
| **M3** — Arabic translation | Human translators deliver `ar/` JSON files | Translators, 1 week |
| **M4** — RTL + Font | Tailwind logical properties audit, Arabic font integration, `dir` attribute, layout QA | 1 engineer, 3 days |
| **M5** — Email i18n | Email templates localized, locale resolution from user record | 1 engineer, 2 days |
| **M6** — Language switcher | Switcher component, cookie persistence, DB locale save | 1 engineer, 2 days |
| **M7** — SEO + Sitemap | hreflang, sitemap, OG metadata | 0.5 engineer, 1 day |
| **M8** — Testing + QA | Unit tests, Playwright visual regression, RTL review, translation QA | 1 engineer + QA, 3 days |

**Total V2 estimate:** ~3 weeks engineering + 1 week translation (parallel)

### V3 Additions (French + German)

1. Add `'fr'` and `'de'` to `routing.ts` locales array.
2. Create `src/messages/fr/` and `src/messages/de/` — identical structure to `en/`.
3. Both are LTR Latin-script; no font, dir, or layout changes required.
4. Human translators deliver JSON files.
5. Ship.

**V3 estimate:** ~3 days engineering (routing + type updates) + translation time.

---

## 20. Open Questions

| # | Question | Decision Needed By |
|---|----------|--------------------|
| 1 | Should Arabic be the default for users whose browser `Accept-Language` is `ar`? Or always default to English? | Product — affects M1 middleware config | -> Arabic Should be the default for users whose browser `Accept-Language` is `ar`
| 2 | Course content (titles, descriptions) in Arabic — V2 or V3? Current proposal defers to V3. | Product | -> Yeah we Should Consider Doing that in that Plan but at the Last Step
| 3 | Should the admin dashboard show Arabic for Arabic-locale admins in V2? Current proposal says no. | Engineering Lead | -> Admin Pages are English Only
| 4 | Translation vendor selection (human translators). | Content / Product | -> Human Translators
| 5 | Scholar profile URL slug — locale-specific slugs or shared slug across locales? | Engineering | -> Keep the Slugs the same in English to Keep the URLs the same.

---

## Appendix A — Affected Files Summary

| File | Change Type |
|------|-------------|
| `package.json` | Add `next-intl` |
| `src/middleware.ts` | Create — locale routing |
| `src/lib/i18n/routing.ts` | Create — locale config |
| `next.config.ts` | Add `next-intl` plugin |
| `src/app/[locale]/layout.tsx` | Create — locale layout with `lang`, `dir`, font |
| `src/app/layout.tsx` | Remove `lang="en"`, delegate to locale layout |
| `src/app/[locale]/*/` | Migrate all `(platform)`, `auth` routes |
| `src/messages/en/*.json` | Create — extract all hardcoded strings |
| `src/messages/ar/*.json` | Create — Arabic translations |
| `src/lib/email/templates/*.ts` | Refactor — locale-aware templates |
| `src/lib/auth.ts` | Update — pass locale to email send |
| `src/db/schema/auth-schema.ts` | Add `locale` column |
| `src/db/migrations/` | New migration for `locale` column |
| `src/components/locale-switcher.tsx` | Create — language toggle UI |
| `src/app/[locale]/sitemap.ts` | Update — hreflang + all locale variants |
| `src/config/env.ts` | No change required |
| `src/app/globals.css` | Add `:lang(ar)` font/spacing rules |
| `.eslintrc` | Add RTL logical property lint rules |

---

## Appendix B — Arabic Typography Reference

| Property | English (LTR) | Arabic (RTL) |
|----------|--------------|--------------|
| Font | Inter | Noto Sans Arabic |
| `font-weight` heading | 700 (bold) | 600 (semibold) |
| `line-height` body | 1.5 | 1.8 |
| `letter-spacing` | 0–0.02em | 0 (always) |
| Text direction | LTR | RTL |
| Numerals | Western (1, 2, 3) | Western preferred in mixed content |
| Punctuation mirroring | `(`, `[`, `"` | `)`, `]`, `"` (browser handles automatically) |
| Icon direction | Default | Flip directional icons (`→`, `←`, `‹`, `›`) with `rtl:rotate-180` |
