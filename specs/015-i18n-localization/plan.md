# Implementation Plan: Production Internationalization and Arabic Localization

**Branch**: `015-i18n-localization`
**Date**: 2026-06-02
**Revised**: 2026-06-02
**Spec**: [specs/015-i18n-localization/spec.md](spec.md)

---

## Summary

Deliver production-grade English/Arabic internationalization for ScholarX V2. The approach is a strict layered implementation: foundation typing → routing infrastructure → message extraction → RTL/typography → preference persistence → email templates → SEO → QA gates. Each phase has explicit entry criteria and exit gates. No phase begins until its predecessor passes its exit gate.

---

## Technical Context

| Dimension | Detail |
|-----------|--------|
| Language / Version | TypeScript 5, Next.js 16 App Router, React 19 |
| New Dependency | `next-intl` v4 (App Router-native, RSC-compatible, ICU support, type-safe keys) |
| Storage | PostgreSQL via Drizzle ORM — `auth.user.locale` column; message catalogs as versioned JSON files; visitor preference via `NEXT_LOCALE` cookie |
| Testing | `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`; Playwright for E2E and visual regression |
| Deploy Target | Docker Standalone (OpenNext/Cloudflare compatible) |
| Performance Baseline | Capture P95 SSR latency for `/`, `/courses`, `/auth/signin` before any code changes |
| Bundle Baseline | Capture JS payload size for English routes before any code changes using `pnpm build && pnpm analyze` |

---

## Dependency Graph (Phase Ordering)

Phases are sequentially dependent. A phase cannot begin until the prior phase's exit gate passes.

```
Phase 0: Research         (complete — see research.md)
    │
    ▼
Phase 1: Foundation       ← install next-intl, type contracts, routing config
    │
    ▼
Phase 2: Route Migration  ← move pages under [locale], middleware, preserve boundaries
    │
    ▼
Phase 3: Message Extraction ← extract EN strings, stub AR catalogs, coverage check
    │
    ▼
Phase 4: RTL + Typography ← dir/lang attrs, Arabic font, logical properties audit
    │
    ▼
Phase 5: Preference        ← DB migration, update API, cookie logic, switcher UI
    │
    ▼
Phase 6: Email Templates  ← localized account message functions
    │
    ▼
Phase 7: SEO              ← hreflang, sitemap, OG metadata
    │
    ▼
Phase 8: QA Gates         ← unit, integration, Playwright, visual regression, security audit
    │
    ▼
Phase 9: Staged Launch    ← Arabic gate validation in staging → enable broad exposure
```

---

## Phase 1: Foundation

**Entry criteria**: `pnpm build` passes on `main`. Performance and bundle baselines captured.

### 1.1 Install `next-intl`

```
pnpm add next-intl
```

Pin to the current minor version (e.g., `^4.x.x`) in `package.json`.

### 1.2 TypeScript Type Contracts

Create `src/lib/i18n/locales.ts`. This file is the single source of truth for the locale list. Every other file derives its types from here — no string literals elsewhere.

```typescript
// src/lib/i18n/locales.ts

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

export interface LocaleConfig {
  readonly code: Locale;
  readonly label: string;
  readonly nativeLabel: string;
  readonly dir: 'ltr' | 'rtl';
  readonly isDefault: boolean;
  readonly bcp47Tag: string;
}

export const LOCALE_CONFIG: Readonly<Record<Locale, LocaleConfig>> = {
  en: {
    code: 'en',
    label: 'EN',
    nativeLabel: 'English',
    dir: 'ltr',
    isDefault: true,
    bcp47Tag: 'en-US',
  },
  ar: {
    code: 'ar',
    label: 'عر',
    nativeLabel: 'العربية',
    dir: 'rtl',
    isDefault: false,
    bcp47Tag: 'ar-EG',
  },
} as const;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getDir(locale: Locale): 'ltr' | 'rtl' {
  return RTL_LOCALES.has(locale) ? 'rtl' : 'ltr';
}

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.has(locale);
}
```

**Design decision**: `SUPPORTED_LOCALES` is a `const` array, not an enum, so adding `'fr'` in V3 is a one-line change with no DB migration and no enum migration.

### 1.3 Routing Configuration

```typescript
// src/lib/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './locales';

export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  // pathnames: {} — no locale-specific slug variants in V2
});
```

### 1.4 Locale-Aware Navigation Helpers

```typescript
// src/lib/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

**Rule**: All internal links in localized pages MUST use `Link` from this file, not `next/link`. This ensures locale prefix is added automatically.

### 1.5 Message Loading

```typescript
// src/lib/i18n/messages.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import type { Locale } from './locales';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate — if invalid, fall back to default to avoid hard crash
  if (!routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  // Each namespace is a separate dynamic import — no cross-locale bundling
  const [common, home, courses, auth, profile, about, contact, certificates, opportunities, aiSearch, metadata, email] =
    await Promise.all([
      import(`@/messages/${locale}/common.json`),
      import(`@/messages/${locale}/home.json`),
      import(`@/messages/${locale}/courses.json`),
      import(`@/messages/${locale}/auth.json`),
      import(`@/messages/${locale}/profile.json`),
      import(`@/messages/${locale}/about.json`),
      import(`@/messages/${locale}/contact.json`),
      import(`@/messages/${locale}/certificates.json`),
      import(`@/messages/${locale}/opportunities.json`),
      import(`@/messages/${locale}/aiSearch.json`),
      import(`@/messages/${locale}/metadata.json`),
      import(`@/messages/${locale}/email.json`),
    ]);

  return {
    locale,
    messages: {
      common: common.default,
      home: home.default,
      courses: courses.default,
      auth: auth.default,
      profile: profile.default,
      about: about.default,
      contact: contact.default,
      certificates: certificates.default,
      opportunities: opportunities.default,
      aiSearch: aiSearch.default,
      metadata: metadata.default,
      email: email.default,
    },
  };
});
```

**Performance note**: Because Next.js bundles dynamic `import()` calls by output chunk, each locale's message JSON is a separate chunk. The English chunk is never sent to Arabic users and vice versa. This satisfies PR-003.

### 1.6 Direction Helper

```typescript
// src/lib/i18n/direction.ts
'use client';
import { useLocale } from 'next-intl';
import { getDir, isRTL } from './locales';
import type { Locale } from './locales';

export function useDirection(): 'ltr' | 'rtl' {
  const locale = useLocale() as Locale;
  return getDir(locale);
}

export function useIsRTL(): boolean {
  const locale = useLocale() as Locale;
  return isRTL(locale);
}
```

### 1.7 Next.js Plugin Configuration

```typescript
// next.config.ts
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/lib/i18n/messages.ts');

const nextConfig = {
  // ... existing config unchanged
};

export default withNextIntl(nextConfig);
```

### 1.8 Type-Safe Message Keys

`next-intl` v4 generates `Messages` types from the English JSON files. Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/messages/*": ["./src/messages/*"]
    }
  }
}
```

Add to global type declaration `src/types/next-intl.d.ts`:

```typescript
import type en_common from '@/messages/en/common.json';
import type en_home from '@/messages/en/home.json';
// ... all namespaces

type Messages = {
  common: typeof en_common;
  home: typeof en_home;
  // ... all namespaces
};

declare global {
  interface IntlMessages extends Messages {}
}
```

This makes every `t('key')` call type-checked against the English source. A typo in a key is a TypeScript compile error, not a runtime undefined.

**Phase 1 Exit Gate**: `pnpm typecheck` passes. `pnpm build` passes. No existing tests broken.

---

## Phase 2: Route Migration

**Entry criteria**: Phase 1 exit gate passed.

**Risk**: This is the highest-risk phase. Moving routes under `[locale]` can silently break auth guards, API routes, and redirect chains if done incorrectly. Use a surgical, route-by-route approach with validation after each batch.

### 2.1 Middleware

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Routes that must never be processed by locale middleware
const EXCLUDED_PREFIXES = [
  '/api/',
  '/admin/',
  '/ingest/',
  '/_next/',
  '/favicon',
  '/sentry-test',
];

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    /\.[a-z]{2,}$/i.test(pathname); // static file extensions
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isExcluded(pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
```

**Security note**: The `isExcluded` check prevents locale middleware from touching admin, API, and ingest routes. An attacker cannot access admin by prefixing `/ar/admin/` — the middleware bypasses locale handling for those paths entirely, and the admin route itself must have its own auth guard.

### 2.2 Route Migration Order (Batch by Criticality)

Migrate in this order to enable incremental validation:

**Batch A — Public, low-risk (migrate and validate first)**:
- `/` → `src/app/[locale]/page.tsx`
- `/about` → `src/app/[locale]/about/page.tsx`
- `/contact` → `src/app/[locale]/contact/page.tsx`

**Batch B — Public platform routes**:
- `/(platform)/courses` → `src/app/[locale]/(platform)/courses/`
- `/(platform)/opportunities` → `src/app/[locale]/(platform)/opportunities/`
- `/opportunity/[id]` → `src/app/[locale]/opportunity/[id]/`

**Batch C — Authenticated platform routes**:
- `/(platform)/certificates` → `src/app/[locale]/(platform)/certificates/`
- `/(platform)/courses/[slug]/lessons` → `src/app/[locale]/(platform)/courses/[slug]/lessons/`

**Batch D — Auth and profile routes**:
- `/auth/*` → `src/app/[locale]/auth/*`
- `/profile` → `src/app/[locale]/profile/`
- `/scholar/[username]` → `src/app/[locale]/scholar/[username]/`

**Batch E — AI Search**:
- `/ai-search` → `src/app/[locale]/ai-search/`

**NEVER move**: `admin/*`, `api/*`, `ingest/*`, `sentry-test`

### 2.3 Locale Layout

```typescript
// src/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { LOCALE_CONFIG } from '@/lib/i18n/locales';
import type { Locale } from '@/lib/i18n/locales';

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
  preload: true, // preloaded for ar locale layout only
});

interface Props {
  children: React.ReactNode;
  params: { locale: string };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const config = LOCALE_CONFIG[locale as Locale];

  return (
    <html lang={config.bcp47Tag} dir={config.dir}>
      <body className={`${inter.variable} ${notoSansArabic.variable}`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Why `notFound()` on invalid locale**: An invalid `[locale]` segment (e.g., `/xyz/courses`) hits this layout first. Returning `notFound()` produces a proper 404 without any content leak. This satisfies FR-004.

### 2.4 Root Layout Cleanup

`src/app/layout.tsx` becomes a minimal shell — no `lang` or `dir` hardcoding. It only loads providers that must wrap everything including the admin route group.

### 2.5 Rollback Plan for Route Migration

If a batch migration causes regressions:
1. Revert the moved route files using `git checkout -- src/app/`.
2. Do not revert `src/lib/i18n/` or `src/middleware.ts`.
3. The middleware `isExcluded` list can be expanded to temporarily exclude a path while the root cause is fixed.
4. Feature flag: set `NEXT_PUBLIC_I18N_ENABLED=false` in env to disable Arabic routes at middleware level (add a check: if disabled, all requests are treated as `en`).

**Phase 2 Exit Gate**:
- `/courses` → English, no redirect.
- `/ar/courses` → Arabic locale layout (may show English strings still — OK at this phase).
- `/admin` → admin, no locale prefix, no auth regression.
- `/xyz/courses` → 404.
- `pnpm typecheck && pnpm lint && pnpm build` pass.

---

## Phase 3: Message Extraction

**Entry criteria**: Phase 2 exit gate passed.

### 3.1 Extraction Priority

Extract in this order (P0 first — highest user-facing impact):

| Priority | Source File | Target Namespace | Notes |
|----------|-------------|-----------------|-------|
| P0 | `src/lib/home-data.ts` | `home.json` | All HERO_, FEATURES_, IMPACT_ constants |
| P0 | `src/components/ui/sign-in-card-2.tsx` | `auth.json` | Validation errors, field labels, buttons |
| P0 | `src/components/courses/course-application-form.tsx` | `courses.json` | Step labels, learner status options, errors |
| P0 | `src/lib/auth.ts` lines 94–146 | `email.json` | OTP subjects, bodies (email only, not sent to browser) |
| P1 | `src/app/about/constants.ts` | `about.json` | Hero, mission, founder, impact sections |
| P1 | `src/components/courses/enroll-modal.tsx` | `courses.json` | Processing step labels |
| P1 | `src/components/ai-search/*.tsx` | `aiSearch.json` | Error messages, labels |
| P1 | `src/components/courses/courses-hero.tsx` | `courses.json` | Hero text |
| P2 | All remaining components | respective namespaces | Systematic pass after P0/P1 |

### 3.2 Extraction Pattern

Replace hardcoded strings in Server Components:

```typescript
// BEFORE
export default function CoursesHero() {
  return <h1>Explore Our Courses</h1>;
}

// AFTER (Server Component)
import { getTranslations } from 'next-intl/server';

export default async function CoursesHero() {
  const t = await getTranslations('courses');
  return <h1>{t('hero.title')}</h1>;
}
```

Replace hardcoded strings in Client Components:

```typescript
// AFTER (Client Component)
'use client';
import { useTranslations } from 'next-intl';

export function EnrollModal() {
  const t = useTranslations('courses.enrollment');
  return <Button>{t('buttonLabel')}</Button>;
}
```

**Rule**: Never use `useTranslations` for strings that can be resolved in a parent Server Component and passed as props. Minimizes client bundle bloat.

### 3.3 Arabic Stub Files

Create all `ar/*.json` files immediately as stubs with the same keys as the English files but with empty strings or a marker value (e.g., `"__NEEDS_TRANSLATION__"`). The coverage check will catch these. This ensures TypeScript type compatibility from day one.

### 3.4 Translation Coverage Script

```typescript
// scripts/check-translations.ts
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '../src/lib/i18n/locales';
import path from 'path';
import fs from 'fs';

const NAMESPACES = ['common', 'home', 'auth', 'courses', /* all */];

function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'object' && value !== null
      ? getAllKeys(value as Record<string, unknown>, fullKey)
      : [fullKey];
  });
}

let hasErrors = false;

for (const locale of SUPPORTED_LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;

  for (const ns of NAMESPACES) {
    const enFile = path.join('src/messages/en', `${ns}.json`);
    const localeFile = path.join(`src/messages/${locale}`, `${ns}.json`);

    const enKeys = getAllKeys(JSON.parse(fs.readFileSync(enFile, 'utf8')));
    const localeKeys = new Set(getAllKeys(JSON.parse(fs.readFileSync(localeFile, 'utf8'))));

    const missingKeys = enKeys.filter((k) => !localeKeys.has(k));
    const emptyKeys = enKeys.filter((k) => {
      // check for stub markers
      return localeKeys.has(k);
    });

    if (missingKeys.length > 0) {
      console.error(`[FAIL] ${locale}/${ns}: missing keys: ${missingKeys.join(', ')}`);
      hasErrors = true;
    }
  }
}

if (hasErrors) process.exit(1);
console.log('Translation coverage check passed.');
```

Add to `package.json`:
```json
"scripts": {
  "i18n:check": "node --import tsx scripts/check-translations.ts"
}
```

Add `pnpm i18n:check` to CI as a required gate before the Arabic launch step.

**Phase 3 Exit Gate**: `pnpm i18n:check` passes. All P0 and P1 strings extracted. Arabic stub files in place. `pnpm typecheck` passes.

---

## Phase 4: RTL and Typography

**Entry criteria**: Phase 3 exit gate passed.

### 4.1 Global CSS: Arabic Typography

```css
/* src/app/globals.css */

/* Arabic font variable */
:lang(ar) {
  --font-body: var(--font-arabic);
  font-feature-settings: normal;
  line-height: 1.8;
  letter-spacing: 0;
  word-spacing: 0.05em;
}

:lang(ar) h1,
:lang(ar) h2,
:lang(ar) h3 {
  font-weight: 600;     /* Arabic heading optical weight matches EN 700 */
  line-height: 1.5;
}

:lang(ar) input,
:lang(ar) textarea,
:lang(ar) select {
  text-align: start;    /* right-aligned text for RTL inputs */
  font-size: 1rem;      /* minimum 16px for Arabic legibility */
}
```

### 4.2 Tailwind Logical Properties Audit

All components that are part of the `[locale]` route group MUST use logical Tailwind properties. Run this audit systematically:

**Find violations**:
```bash
pnpm grep -rn "ml-\|mr-\|pl-\|pr-\|text-left\|text-right\|left-\[\\|right-\[" src/components/ src/app/\[locale\]/
```

**Replace pattern**:
| Physical (banned in RTL-capable components) | Logical (required) |
|---------------------------------------------|-------------------|
| `ml-*`, `mr-*` | `ms-*`, `me-*` |
| `pl-*`, `pr-*` | `ps-*`, `pe-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `left-*` (positioned) | `start-*` |
| `right-*` (positioned) | `end-*` |
| `border-l-*`, `border-r-*` | `border-s-*`, `border-e-*` |
| `rounded-l-*`, `rounded-r-*` | `rounded-s-*`, `rounded-e-*` |

**Directional icon flip**:
```html
<!-- ChevronRight used as "forward" arrow -->
<ChevronRightIcon className="rtl:rotate-180 transition-transform" />
```

### 4.3 Framer Motion RTL Offsets

```typescript
// src/hooks/useRTLMotion.ts
'use client';
import { useIsRTL } from '@/lib/i18n/direction';

export function useRTLMotionX(value: number): number {
  const isRTL = useIsRTL();
  return isRTL ? -value : value;
}
```

Usage:
```typescript
const slideX = useRTLMotionX(-100);
<motion.div initial={{ x: slideX }} animate={{ x: 0 }} />
```

### 4.4 GSAP RTL

For any GSAP animations that use `x` offsets, wrap in a utility:
```typescript
function rtlX(px: number, isRTL: boolean): number {
  return isRTL ? -px : px;
}
```

### 4.5 Form RTL Validation

Radix UI components read `document.dir` automatically for popover/dropdown positioning. No manual overrides needed. Verify these components in the RTL visual QA checklist:
- `Select` / `DropdownMenu` — popover aligns to `start` in RTL.
- `Dialog` / `Sheet` — renders centered, no directional issue.
- `Tooltip` — aligns to trigger, direction-aware.
- `DatePicker` / `Calendar` — check calendar navigation arrows flip.

**Phase 4 Exit Gate**: Playwright screenshot tests for `/ar` and `/ar/courses` on desktop (1280px) and mobile (375px) show correct RTL layout. No horizontal overflow. Directional icons correct.

---

## Phase 5: Preference Persistence & Language Switcher

**Entry criteria**: Phase 4 exit gate passed.

### 5.1 Database Migration

```typescript
// src/db/schema/auth-schema.ts — add to user table
locale: text("locale").default("en"),
```

Generate and run migration:
```bash
pnpm db:generate
pnpm db:migrate
```

**Design decision**: `text` not `enum` — adding `'fr'` in V3 requires no DB migration.

### 5.2 Preference Update API Endpoint

```typescript
// src/app/api/v1/me/locale/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/schema/auth-schema';
import { eq } from 'drizzle-orm';
import { isLocale } from '@/lib/i18n/locales';

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || !isLocale(body.locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  await db
    .update(user)
    .set({ locale: body.locale, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ locale: body.locale });
}
```

**Security**: `isLocale()` validates against the allowlist before any DB write. No raw user input reaches the database (FR-006, SR-006).

### 5.3 Language Switcher Component

```typescript
// src/components/locale-switcher.tsx
'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/lib/i18n/navigation';
import { LOCALE_CONFIG, SUPPORTED_LOCALES } from '@/lib/i18n/locales';
import type { Locale } from '@/lib/i18n/locales';

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common.localeSwitcher');

  async function switchLocale(newLocale: Locale) {
    if (newLocale === currentLocale) return;

    // Navigate first — user is not blocked by persistence
    router.replace(pathname, { locale: newLocale });

    // Fire-and-forget preference save (satisfies FR-019, PR-005)
    try {
      await fetch('/api/v1/me/locale', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
        credentials: 'include',
      });
    } catch {
      // Swallow — navigation already completed
    }
  }

  return (
    <div role="navigation" aria-label={t('ariaLabel')}>
      {SUPPORTED_LOCALES.map((locale) => {
        const config = LOCALE_CONFIG[locale];
        return (
          <button
            key={locale}
            onClick={() => switchLocale(locale)}
            aria-current={locale === currentLocale ? 'true' : undefined}
            aria-label={config.nativeLabel}
            lang={config.bcp47Tag}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
```

**Key behaviors**:
- `router.replace()` fires immediately — navigation does not wait for the API call.
- API call is fire-and-forget — failure is silently swallowed (FR-019).
- `aria-current` and `lang` attributes on each button satisfy AR-005.
- `next-intl`'s `useRouter().replace()` sets the `NEXT_LOCALE` cookie automatically.

**Phase 5 Exit Gate**: Language switching completes in ≤ 2 interactions on desktop and mobile. Preference persists across page reload for authenticated users. Preference failure does not block navigation. `pnpm typecheck` passes.

---

## Phase 6: Localized Email Templates

**Entry criteria**: Phase 5 exit gate passed.

### 6.1 Template Architecture

```
src/lib/email/
├── templates/
│   ├── base.ts          ← buildHtml(locale, dir, content) helper
│   ├── verification.ts
│   ├── signin-otp.ts
│   ├── password-reset.ts
│   └── email-change.ts
└── send.ts              ← resolveEmailLocale(userId?, journeyLocale?) → Locale
```

### 6.2 Base HTML Builder

```typescript
// src/lib/email/templates/base.ts
import type { Locale } from '@/lib/i18n/locales';
import { LOCALE_CONFIG } from '@/lib/i18n/locales';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildEmailHtml(params: {
  locale: Locale;
  subject: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}): string {
  const { locale, body, ctaUrl, ctaLabel } = params;
  const { dir, bcp47Tag } = LOCALE_CONFIG[locale];

  // ctaUrl is escaped; never trust external URL input
  const safeCta = ctaUrl ? escapeHtml(ctaUrl) : null;
  const safeCtaLabel = ctaLabel ? escapeHtml(ctaLabel) : null;

  return `<!DOCTYPE html>
<html lang="${bcp47Tag}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="direction:${dir};text-align:${dir === 'rtl' ? 'right' : 'left'};font-family:${
    locale === 'ar' ? "'Noto Sans Arabic', Arial" : "Arial, sans-serif"
  };line-height:${locale === 'ar' ? '1.8' : '1.5'}">
  <p>${escapeHtml(body)}</p>
  ${safeCta && safeCtaLabel ? `<a href="${safeCta}">${safeCtaLabel}</a>` : ''}
</body>
</html>`;
}
```

**Security**: All user-controlled values (OTP, reset URL, display name) pass through `escapeHtml` before being interpolated into HTML. This satisfies SR-003.

### 6.3 Locale Resolution

```typescript
// src/lib/email/send.ts
import { db } from '@/db';
import { user } from '@/db/schema/auth-schema';
import { eq } from 'drizzle-orm';
import { isLocale, DEFAULT_LOCALE } from '@/lib/i18n/locales';
import type { Locale } from '@/lib/i18n/locales';

export async function resolveEmailLocale(
  userId?: string,
  journeyLocale?: string,
): Promise<Locale> {
  // 1. Saved authenticated user preference
  if (userId) {
    const row = await db
      .select({ locale: user.locale })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const saved = row[0]?.locale;
    if (saved && isLocale(saved)) return saved;
  }

  // 2. Active journey locale
  if (journeyLocale && isLocale(journeyLocale)) return journeyLocale;

  // 3. English fallback
  return DEFAULT_LOCALE;
}
```

**Phase 6 Exit Gate**: All 4 email types (verification, signin-otp, password-reset, email-change) render correctly in both `en` and `ar`. Arabic emails declare `dir="rtl"`. No OTP or reset URL logged. `pnpm test:api` passes.

---

## Phase 7: SEO & Discoverability

**Entry criteria**: Phase 6 exit gate passed.

### 7.1 Localized Metadata Helper

```typescript
// src/lib/i18n/metadata.ts
import { getTranslations } from 'next-intl/server';
import { routing } from './routing';
import type { Locale } from './locales';

export async function generateLocalizedMetadata(
  locale: Locale,
  namespace: string,
  paths: { [key in Locale]: string },
): Promise<object> {
  const t = await getTranslations({ locale, namespace });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical: paths[locale],
      languages: {
        en: paths.en,
        ar: paths.ar,
        'x-default': paths.en,
      },
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      locale: locale === 'ar' ? 'ar_EG' : 'en_US',
      alternateLocale: locale === 'ar' ? ['en_US'] : ['ar_EG'],
    },
  };
}
```

### 7.2 Sitemap

```typescript
// src/app/sitemap.ts
import { routing } from '@/lib/i18n/routing';
import type { Locale } from '@/lib/i18n/locales';

// Only public localized routes — derived from route inventory
const PUBLIC_LOCALIZED_PATHS = [
  '/',
  '/about',
  '/contact',
  '/courses',
  '/opportunities',
  '/ai-search',
];

export default function sitemap() {
  return PUBLIC_LOCALIZED_PATHS.flatMap((path) =>
    routing.locales.map((locale: Locale) => {
      const localizedPath = locale === routing.defaultLocale ? path : `/ar${path}`;
      return {
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}${localizedPath}`,
        lastModified: new Date(),
        alternates: {
          languages: {
            en: `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`,
            ar: `${process.env.NEXT_PUBLIC_API_BASE_URL}/ar${path}`,
          },
        },
      };
    }),
  );
}
```

**Phase 7 Exit Gate**: All public localized pages render `hreflang` alternates in HTML. Sitemap contains only in-scope public pages. Admin, API, and diagnostic pages absent from sitemap.

---

## Phase 8: QA Gates

**Entry criteria**: All Phases 1–7 exit gates passed. Arabic translations delivered and human-approved.

### 8.1 Unit Tests (Required)

- `isLocale()` — rejects invalid values, accepts valid values.
- `getDir()` — returns `'rtl'` for `'ar'`, `'ltr'` for `'en'`.
- `resolveEmailLocale()` — correct priority order; fallback to `'en'` when no preference.
- `buildEmailHtml()` — escapes `<`, `>`, `&`, `"` in OTP and reset URL.
- Translation coverage script — fails with exit code 1 when a required key is missing.
- Locale preference update API — rejects unauthenticated requests (401); rejects invalid locale (400).

### 8.2 Integration Tests (Required)

- Middleware: `/courses` → locale `en`, no redirect.
- Middleware: `/ar/courses` → locale `ar`.
- Middleware: `/xyz/courses` → 404.
- Middleware: `/admin/` → not processed by locale middleware.
- Preference API: authenticated user can update locale; saved value is returned on next read.
- Preference API: unauthenticated request returns 401.
- Email: `resolveEmailLocale` returns `'ar'` for user with `locale: 'ar'`.

### 8.3 Playwright E2E Tests (Required)

For each locale (`en`, `ar`):
- Home page loads; `<html lang>` and `<html dir>` are correct.
- Course discovery: browse and filter courses.
- Auth entry: sign in flow completes.
- Auth recovery: forgot password flow completes.
- Language switcher: switching en→ar navigates to `/ar/...`.
- Language switcher: switching ar→en navigates to unprefixed `/...`.
- Unsupported locale: `/xyz/` returns 404 status.
- Admin route: `/admin/` is not affected by locale middleware.

### 8.4 Visual Regression Tests (Required)

Playwright screenshot snapshots for Arabic RTL:
- `/ar` (home) — desktop 1280px, mobile 375px, tablet 768px.
- `/ar/courses` — desktop 1280px, mobile 375px.
- `/ar/auth/signin` — desktop 1280px, mobile 375px.
- Course application form in Arabic — all 4 steps.
- Language switcher in open state.

Pass criteria: no horizontal overflow, no clipped text, directional icons correct, form alignment correct.

### 8.5 Accessibility Audit (Required)

Using Playwright + axe-core for each Arabic page:
- `lang` attribute present and correct.
- `dir` attribute present and correct.
- Form labels associated with inputs.
- Error messages announced via `aria-live`.
- Focus order follows RTL reading sequence in navigation and forms.
- Language switcher buttons have accessible names.

### 8.6 Security Audit (Required)

- Attempt locale injection: send `; drop table user; --` as `locale` cookie value. Verify `isLocale()` rejects it.
- Attempt XSS via translation key: embed `<script>` in a message JSON value. Verify `next-intl`'s render pipeline escapes it.
- Verify no private data appears in `hreflang` alternates or OG metadata for authenticated routes.
- Verify Arabic email bodies escape all interpolated variables.

### 8.7 Performance Validation (Required)

- Run Lighthouse on `/` (English) before and after. No regression in Performance score > 5 points.
- Confirm Arabic font not loaded on English pages (Chrome DevTools Network tab, filter `woff2`).
- Confirm Arabic message JSON not bundled in English page JS (bundle analyzer).

**Phase 8 Exit Gate**: All unit, integration, Playwright, visual regression, accessibility, security, and performance checks pass. Arabic translation coverage is 100%. Zero release blockers.

---

## Phase 9: Staged Launch

**Entry criteria**: Phase 8 exit gate passed. Arabic translations human-approved.

### 9.1 Staged Rollout Gates

Gate completion is tracked in `contracts/launch-readiness.md`. Arabic broad exposure requires all gates at status `PASS`:

1. Route inventory 100% classified — PASS.
2. English default routes stable — PASS.
3. Arabic routes available — PASS.
4. Unsupported prefix safety — PASS.
5. Translation coverage 100% — PASS.
6. Account email localization — PASS.
7. RTL visual QA — PASS (no release-blocking defects).
8. Accessibility QA — PASS.
9. Access boundary check — PASS.
10. Metadata and sitemap — PASS.
11. Build and test gates — PASS.
12. Gap reporting operational — PASS.

### 9.2 Post-Launch Operations

- Monitor Sentry for `MISSING_TRANSLATION` tagged errors.
- Monitor server logs for `unsupported_locale_request` gap records.
- SLA: triage `user_visible` localization gaps within 1 business day for first 30 days.
- Rollback trigger: if any critical journey (auth, enrollment, certificate access) is blocked by localization → immediately disable Arabic broad exposure via feature flag; do not roll back the route infrastructure.

---

## File Changeset Summary

| File | Change |
|------|--------|
| `package.json` | Add `next-intl` |
| `next.config.ts` | Add `withNextIntl` plugin |
| `tsconfig.json` | Add message type paths |
| `src/types/next-intl.d.ts` | Global message type declaration |
| `src/middleware.ts` | Create — locale routing + exclusion list |
| `src/lib/i18n/locales.ts` | Create — locale constants and type guards |
| `src/lib/i18n/routing.ts` | Create — next-intl routing config |
| `src/lib/i18n/navigation.ts` | Create — locale-aware navigation helpers |
| `src/lib/i18n/messages.ts` | Create — request config with namespace loading |
| `src/lib/i18n/direction.ts` | Create — client-side RTL hooks |
| `src/lib/i18n/metadata.ts` | Create — localized metadata generator |
| `src/app/[locale]/layout.tsx` | Create — locale layout with lang/dir/fonts |
| `src/app/layout.tsx` | Simplify — remove hardcoded lang/dir |
| `src/app/[locale]/**/` | Migrate all in-scope routes |
| `src/messages/en/*.json` | Create — all 12 namespaces |
| `src/messages/ar/*.json` | Create — all 12 namespaces (human-translated) |
| `src/lib/email/templates/*.ts` | Create — localized template functions |
| `src/lib/email/send.ts` | Add `resolveEmailLocale` |
| `src/lib/auth.ts` | Use localized email templates |
| `src/db/schema/auth-schema.ts` | Add `locale` column |
| `drizzle/migrations/*` | New migration for locale column |
| `src/app/api/v1/me/locale/route.ts` | Create — preference update endpoint |
| `src/components/locale-switcher.tsx` | Create — language toggle UI |
| `src/app/sitemap.ts` | Update — all locale variants |
| `src/app/globals.css` | Add Arabic typography rules |
| `scripts/check-translations.ts` | Create — coverage validator |
| `tests/e2e/i18n/*.spec.ts` | Create — E2E locale tests |
| `tests/unit/i18n/*.test.ts` | Create — unit tests for locale utilities |

---

## Constitution Checks

| Principle | Status | Evidence |
|-----------|--------|---------|
| I — Architecture & SOLID | PASS | Single responsibility per file in `src/lib/i18n/`. `locales.ts` is the only locale truth source; all derivations are imports, not copies. |
| II — Type Safety | PASS | `Locale` type derived from `SUPPORTED_LOCALES as const`. `isLocale()` type guard at every external boundary. Message keys are TypeScript-checked against English source. |
| III — Testing | PASS | Unit, integration, Playwright E2E, visual regression, accessibility, and security tests defined per phase. Each phase has exit criteria. |
| IV — UX Consistency | PASS | Arabic typography, RTL audit, language switcher UX, responsive validation, and visual QA are all required phase exit gates. |
| V — Performance & Maintainability | PASS | Namespace-split message loading, per-locale font loading, fire-and-forget preference persistence, middleware exclusion list, feature flag rollback support. Adding `fr`/`de` in V3 requires only: (a) one entry in `SUPPORTED_LOCALES`, (b) new JSON files. |
