# i18n Implementation Review — ScholarX V2

**Reviewer:** Principal Software Engineer  
**Date:** 2026-06-06  
**Branch:** `015-i18n-localization`  
**Scope:** Full internationalization layer (EN/AR) across routing, messages, components, database, email, SEO, and validation tooling  
**Stack:** Next.js 16 App Router · React 19 · next-intl 4.13 · TypeScript 5 · Drizzle ORM

---

## Executive Summary

The i18n architecture is well-conceived. The choice of `next-intl` v4, the `as-needed` locale prefix strategy, type-safe message namespaces, per-locale dynamic imports, user locale persistence, and RTL email templates all reflect solid engineering judgment. The specification documents (`SPEC-I18N.md`, `specs/015-i18n-localization/`) are unusually thorough for a project of this size.

That said, there are **two critical defects** that will cause visible breakage on every Arabic page: duplicate shell rendering from nested layouts, and missing Arabic font configuration. These must be resolved before any Arabic traffic reaches production. Additionally, email template strings are maintained outside the message system, creating silent translation drift, and the middleware's intl/auth integration has an ordering flaw that discards intl headers on redirects.

The table below summarizes all findings by severity.

---

## Findings Summary

| # | Severity | Category | Title | Status |
|---|----------|----------|-------|--------|
| 1 | **P0 — Critical** | Layout | Nested layouts render shell twice on all `[locale]` routes | ✅ Fixed |
| 2 | **P0 — Critical** | Fonts | Arabic glyphs fall back to system fonts — no Arabic subset loaded | ✅ Fixed |
| 3 | **P1 — High** | Email | Email template strings duplicated outside the message system | ✅ Fixed |
| 4 | **P1 — High** | Middleware | Auth redirect discards intl middleware headers and cookies | ✅ Fixed |
| 5 | **P2 — Medium** | i18n Util | `resolveLocaleSwitchPathname` contains dead code — both branches return identical values | ✅ Fixed |
| 6 | **P2 — Medium** | Type Safety | `useLocale() as Locale` is an unsafe cast without runtime validation | ✅ Fixed |
| 7 | **P2 — Medium** | SEO / Scalability | `buildLocalizedPath` hardcodes the `ar` prefix string | ✅ Fixed |
| 8 | **P2 — Medium** | Maintenance | `OPEN_ROUTES` in middleware is duplicated from and out of sync with `ROUTE_INVENTORY` | ✅ Fixed |
| 9 | **P2 — Medium** | Security | No rate limiting on `PATCH /api/v1/me/locale` | ✅ Fixed |
| 10 | **P3 — Low** | Hydration | `suppressHydrationWarning` on `<html>` is broader than necessary | ✅ Fixed |
| 11 | **P3 — Low** | DX | `inter.variable` applied to `<html>` element instead of `<body>` | ✅ Fixed |
| 12 | **P3 — Low** | Observability | AI search components — translated string coverage not verifiable from code | ⚠️ Manual QA required |

---

## Detailed Findings

---

### Finding 1 — P0: Nested layouts render the shell twice on all `[locale]` routes

**File:** `src/app/layout.tsx` · `src/app/[locale]/layout.tsx`

**Description**

`src/app/layout.tsx` (the root layout) unconditionally renders `<PremiumHeader />` and `<Footer />` inside `<GlobalShellExclusions>`. `src/app/[locale]/layout.tsx` also renders its own `<PremiumHeader />` and `<Footer />` unconditionally. Because Next.js App Router nests layouts, every request to `/ar/*` passes through both layouts in sequence. The result is two headers and two footers stacked on every Arabic page.

**Root layout (lines 70–91):**
```tsx
// src/app/layout.tsx
<GlobalShellExclusions>
  <PremiumHeader />   // ← first render
</GlobalShellExclusions>
...
<GlobalShellExclusions>
  <Footer />          // ← first render
</GlobalShellExclusions>
```

**Locale layout (lines 30–38):**
```tsx
// src/app/[locale]/layout.tsx
<NextIntlClientProvider locale={locale} messages={messages}>
  <div className="flex min-h-full flex-col">
    <PremiumHeader />   // ← second render
    <div className="flex flex-1 flex-col">{children}</div>
    <Footer />          // ← second render
  </div>
</NextIntlClientProvider>
```

**Fix**

Remove `<PremiumHeader />` and `<Footer />` from `src/app/[locale]/layout.tsx`. The locale layout's sole responsibilities should be: validate the locale param, call `setRequestLocale`, load messages, and render `<NextIntlClientProvider>`. The root layout already owns the shell.

```tsx
// src/app/[locale]/layout.tsx — after fix
export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

---

### Finding 2 — P0: Arabic glyphs fall back to system fonts — no Arabic subset loaded

**File:** `src/app/layout.tsx` (lines 21–31)

**Description**

All three font declarations use `subsets: ["latin"]` exclusively:

```ts
const inter       = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistSans   = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono   = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

`Inter`, `Geist`, and `Geist Mono` do not ship Arabic character glyphs. When a user browses in Arabic, every rendered Arabic string falls back to whatever sans-serif or serif font the browser considers its default for Arabic text — typically `Arial`, `Times New Roman`, or a platform-native font that has no visual relationship to the design system. The result is an inconsistent, unpolished appearance that undermines the entire localization effort.

**Fix**

Add a dedicated Arabic typeface for body text and headings. A common production choice is `Noto Sans Arabic` (comprehensive Unicode coverage, Google Fonts, free) or `Cairo` (geometric, pairs well with Latin sans-serif). Both are available via `next/font/google`.

```ts
// src/app/layout.tsx
import { Inter, Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
```

Apply the variable to `<html>` (or `<body>`) alongside the existing Latin font variables, then configure Tailwind to use it for RTL contexts:

```css
/* src/app/globals.css */
[dir="rtl"] {
  font-family: var(--font-arabic), sans-serif;
}
```

---

### Finding 3 — P1: Email template strings duplicated outside the message system

**Files:** `src/lib/email/templates/verification.ts` · `src/lib/email/templates/signin-otp.ts` · `src/lib/email/templates/password-reset.ts` · `src/lib/email/templates/email-change.ts`

**Description**

The project correctly defines email copy in `src/messages/en/email.json` and `src/messages/ar/email.json`. However, the template functions do not consume those files. Instead they use hardcoded inline `if (locale === "ar")` branches:

```ts
// src/lib/email/templates/verification.ts
export function verificationEmail(locale: Locale, otp: string, expiryMinutes: number) {
  const isArabic = locale === "ar";
  const subject = isArabic
    ? "رمز التحقق من البريد الإلكتروني في ScholarX"    // ← hardcoded
    : "Your ScholarX email verification code";           // ← hardcoded
  const text = isArabic
    ? `رمز التحقق الخاص بك في ScholarX هو ${otp}. ...`  // ← hardcoded
    : `Your ScholarX verification code is ${otp}. ...`;  // ← hardcoded
  ...
}
```

The `email.json` files exist and have identical content, but are never imported. Translations must now be kept in sync manually across two separate locations. This will silently diverge over time — the JSON files will be updated during a translation audit while the template files are forgotten, or vice versa.

**Fix**

Load translations at runtime using Node's `fs.readFileSync` / `await import()` — or, since the email functions already receive a `Locale`, derive a path and import the JSON directly:

```ts
// src/lib/email/templates/verification.ts
import en from "@/messages/en/email.json";
import ar from "@/messages/ar/email.json";

const EMAIL_MESSAGES = { en, ar } as const;

export function verificationEmail(locale: Locale, otp: string, expiryMinutes: number) {
  const m = EMAIL_MESSAGES[locale].verification;
  const subject = m.subject;
  const text = m.body
    .replace("{otp}", otp)
    .replace("{expiryMinutes}", String(expiryMinutes));

  return {
    subject,
    text,
    html: buildEmailHtml({ locale, heading: subject, body: text }),
  };
}
```

Delete the inline hardcoded strings after migrating. The `check-translations.mjs` script will then enforce parity between locales for email keys too.

---

### Finding 4 — P1: Auth redirect discards intl middleware headers on auth-protected routes

**File:** `src/proxy.ts` (lines 70–138)

**Description**

`intlProxy(request)` is invoked and its response stored on line 70. If an auth redirect fires (lines 98–136), the intl response is abandoned and a fresh `NextResponse.redirect(...)` is returned instead. This discards any response headers, Set-Cookie headers, or cache directives that `next-intl`'s middleware added — including the locale-preference cookie that next-intl uses to persist the resolved locale across requests.

```ts
// src/proxy.ts
const intlResponse = intlProxy(request);   // line 70: intl runs, sets headers
...
if (isAuthRoute && isAuthenticated && ...) {
  return NextResponse.redirect(new URL(target, request.url)); // line 111: intl headers lost
}
if (isAdminRoute && !isAuthenticated) {
  return NextResponse.redirect(new URL(target, request.url)); // line 123: intl headers lost
}
if (!isPublicRoute && !isAuthenticated && ...) {
  return NextResponse.redirect(new URL(target, request.url)); // line 135: intl headers lost
}

return intlResponse;  // line 138: only reached when no redirect fired
```

The symptom: a user browsing in Arabic who is redirected to sign-in lands on the English sign-in page because the locale cookie was never written, and the URL has no `/ar` prefix.

**Fix**

Run auth logic first, then hand off to intlProxy only if no redirect is needed. Alternatively, copy intl headers onto the redirect response:

```ts
// Approach A — check auth before calling intlProxy
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isDevAuthBypassEnabled && ...) return NextResponse.next();
  if (isExcluded(pathname)) return NextResponse.next();

  const localizedPathname = normalizePathname(pathname);
  const locale = getRouteLocale(pathname);
  const isAuthenticated = hasSessionCookie(request);
  // ... compute isAuthRoute, isPublicRoute, isAdminRoute ...

  if (isAuthRoute && isAuthenticated && ...) {
    return NextResponse.redirect(new URL(getLocalizedPathname("/", locale), request.url));
  }
  if (isAdminRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL(getLocalizedPathname(ROUTES.SIGNIN, locale), request.url));
  }
  if (!isPublicRoute && !isAuthenticated && !isAuthRoute && !isAdminRoute) {
    return NextResponse.redirect(new URL(getLocalizedPathname(ROUTES.SIGNIN, locale), request.url));
  }

  // Only call intlProxy when we are not redirecting
  return intlProxy(request);
}
```

---

### Finding 5 — P2: `resolveLocaleSwitchPathname` contains dead code — both branches return the same value

**File:** `src/lib/i18n/switch-locale.ts` (lines 22–27)

**Description**

```ts
export function resolveLocaleSwitchPathname(pathname: string, locale: Locale) {
  const normalizedPathname = pathname || "/";
  const fallbackMatch = FALLBACK_ROUTES.find(({ pattern }) =>
    pattern.test(normalizedPathname),
  );

  if (fallbackMatch) {
    return fallbackMatch.fallback;   // ← only meaningful branch
  }

  if (locale === DEFAULT_LOCALE) {
    return normalizedPathname;       // ← returns normalizedPathname
  }

  return normalizedPathname;         // ← also returns normalizedPathname (dead code)
}
```

Both the `locale === DEFAULT_LOCALE` branch and the final return produce identical output. The function cannot produce different values for different non-default locales. This either means the implementation is incomplete (the non-default branch was intended to prefix the path but was never written) or the conditional is unnecessary noise.

The next-intl router handles the locale prefix internally via `router.replace(pathname, { locale })`, so the pathname argument genuinely doesn't need to change. If that is the intent, the conditional should be removed entirely for clarity. If the intent was to transform the path for non-default locales, the logic is missing.

**Fix (clarify intent — remove dead branch):**
```ts
export function resolveLocaleSwitchPathname(pathname: string, locale: Locale): string {
  const normalizedPathname = pathname || "/";
  const fallback = FALLBACK_ROUTES.find(({ pattern }) => pattern.test(normalizedPathname));
  return fallback ? fallback.fallback : normalizedPathname;
}
```

---

### Finding 6 — P2: `useLocale() as Locale` is an unsafe type cast

**File:** `src/components/locale-switcher.tsx` (line 15)

**Description**

```ts
const currentLocale = useLocale() as Locale;
```

`useLocale()` returns `string`. The `as Locale` cast instructs TypeScript to stop type-checking this assignment, bypassing the runtime guard (`isLocale`) that exists elsewhere in the codebase. If next-intl ever surfaces an unexpected string — misconfigured routing, a future locale not yet in `SUPPORTED_LOCALES`, or a test environment — the component will pass an invalid locale to `LOCALE_CONFIG[currentLocale]`, returning `undefined` and crashing at render time.

**Fix:**
```ts
const rawLocale = useLocale();
const currentLocale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
```

The `isLocale` guard is cheap (one `Array.includes` call) and consistent with the rest of the codebase.

---

### Finding 7 — P2: `buildLocalizedPath` hardcodes the `ar` locale segment

**File:** `src/lib/i18n/metadata.ts` (lines 16–22)

**Description**

```ts
export function buildLocalizedPath(pathname: string, locale: Locale) {
  return locale === "en"
    ? pathname
    : pathname === "/"
      ? "/ar"
      : `/ar${pathname}`;
}
```

The function explicitly constructs `/ar` paths by string concatenation. Adding a third locale (`fr`, `de`) requires modifying this function. Additionally, the logic is subtly inconsistent with `routing.ts`'s `getLocalizedPathname` which already encodes the same logic. Two implementations of the same computation are guaranteed to diverge.

**Fix — derive from `LOCALE_CONFIG` and deduplicate:**
```ts
// src/lib/i18n/metadata.ts
export function buildLocalizedPath(pathname: string, locale: Locale) {
  if (locale === DEFAULT_LOCALE) return pathname;
  return pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
}
```

This is now identical to `getLocalizedPathname` in `routing.ts`. Consider importing `getLocalizedPathname` from `routing.ts` directly and deleting `buildLocalizedPath` from `metadata.ts` to eliminate the duplication entirely.

---

### Finding 8 — P2: `OPEN_ROUTES` in middleware is a manual duplicate of `ROUTE_INVENTORY`

**File:** `src/proxy.ts` (line 13)

**Description**

```ts
const OPEN_ROUTES = new Set<string>(["/", "/about", "/contact", "/courses"]);
```

`src/lib/i18n/route-inventory.ts` already classifies every route with an `authBoundary` field (`"public"`, `"authenticated"`, `"admin"`). The middleware ignores this and re-specifies a partial subset of public routes in its own hardcoded Set. Consequences:

1. Adding a new public route requires touching `proxy.ts` AND `route-inventory.ts`. Forgetting `proxy.ts` incorrectly protects the route.
2. The validation script (`validate-route-inventory.mjs`) cannot detect that `proxy.ts` has drifted.
3. `OPEN_ROUTES` only contains four paths; the route inventory implies several more (e.g., `scholar/[username]`, `opportunity/[id]`) are public but they're handled by `startsWith` checks inline.

**Fix — derive public routes from the inventory:**
```ts
// src/proxy.ts
import { ROUTE_INVENTORY } from "@/lib/i18n/route-inventory";

const OPEN_ROUTES = new Set(
  ROUTE_INVENTORY
    .filter(r => r.authBoundary === "public" && r.status === "localized")
    .map(r => r.englishPath),
);
```

This requires that the route inventory be comprehensive (which it already is), and eliminates the maintenance burden of the duplicate.

---

### Finding 9 — P2: No rate limiting on `PATCH /api/v1/me/locale`

**File:** `src/app/api/v1/me/locale/route.ts`

**Description**

The locale preference endpoint performs a database `UPDATE` on every call with no rate limiting. An authenticated user can send unbounded requests, triggering unbounded DB writes. While the project already has a rate-limiting abstraction in `src/lib/cache/`, this endpoint does not use it.

The risk is not primarily security (auth is required) but availability: a malfunctioning client-side component re-triggering locale switches in a tight loop could saturate the database connection pool.

**Fix**

Apply the existing rate limiter with a conservative threshold:

```ts
// src/app/api/v1/me/locale/route.ts
import { rateLimit } from "@/lib/cache/rate-limit";

export async function PATCH(request: NextRequest) {
  const limited = await rateLimit(`locale:${session.user.id}`, { max: 10, windowMs: 60_000 });
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  ...
}
```

---

### Finding 10 — P3: `suppressHydrationWarning` on `<html>` is broader than necessary

**File:** `src/app/layout.tsx` (line 64)

**Description**

```tsx
<html lang={localeConfig.bcp47Tag} dir={localeConfig.dir} suppressHydrationWarning>
```

`suppressHydrationWarning` on the root `<html>` element silences all React hydration warnings for that node and its subtree. The legitimate reason for it here is that `lang` and `dir` may differ between the server render (which uses the resolved locale from `getLocale()`) and the initial client render before React's hydration completes. However, suppressing warnings at the `<html>` level also masks unrelated bugs — unexpected attribute changes injected by browser extensions, mismatched SSR output, or future regressions.

**Fix**

Keep `suppressHydrationWarning` on `<html>` but add a comment explaining why it's necessary to prevent future engineers from widening or misusing it:

```tsx
{/* suppressHydrationWarning: lang/dir differ between SSR and client rehydration
    when next-intl resolves locale from cookie after the initial render. */}
<html lang={localeConfig.bcp47Tag} dir={localeConfig.dir} suppressHydrationWarning>
```

This is not a code change, but a documentation/review hygiene item.

---

### Finding 11 — P3: Font variable applied to `<html>` instead of `<body>`

**File:** `src/app/layout.tsx` (line 64)

**Description**

```tsx
<html ... className={inter.variable}>
```

`inter.variable` injects a CSS custom property (`--font-sans`) scoped to the element it is applied to. Applying it to `<html>` works — CSS custom properties cascade — but the canonical `next/font` pattern is to apply variables to `<body>`. Applying to `<html>` also means the variable is set before `<head>`, which is technically outside the document body where font rendering is relevant.

The `geistSans.variable` and `geistMono.variable` are correctly applied to `<body>` (line 67). Having `inter.variable` on `<html>` while the others are on `<body>` is inconsistent.

**Fix:** Move `inter.variable` from `<html className>` to `<body className>` alongside the other font variables.

---

### Finding 12 — P3: AI search component translation coverage is not verifiable from code alone

**Files:** `src/components/ai-search/scholarship-card.tsx` · `src/components/ai-search/search-hero-enhanced.tsx` · `src/components/ai-search/search-results.tsx`

**Description**

All three AI search components appear in the git diff for this branch. Visual inspection is required to confirm that every user-visible string in these components is extracted to `src/messages/*/aiSearch.json` and not hardcoded inline. This is not a confirmed defect but a required manual QA step given the pattern of using inline strings found in the email templates (Finding 3).

**Recommended action**

Run the following grep before merging to confirm zero hardcoded user-visible strings remain in these files:

```bash
grep -n '"[A-Z][a-z]' src/components/ai-search/*.tsx
grep -n ">[A-Z][a-z].*</" src/components/ai-search/*.tsx
```

Any matches that are not translation keys or component imports should be extracted to the `aiSearch` namespace.

---

## What Is Working Well

The following design decisions are sound and should be preserved as-is.

**Type-safe locale validation everywhere.** `isLocale()` is called at every trust boundary — route params, API input, email resolution, message loading. The guard function is in one place (`src/lib/i18n/locales.ts`) and is used consistently. This prevents entire classes of locale injection bugs.

**Dynamic per-locale message imports.** The `loadMessages` function in `src/lib/i18n/messages.ts` uses dynamic `import()` per namespace, which means Next.js bundles only the active locale's messages. Arabic translation JSON will never ship to English users and vice versa. This is the correct approach for this library and stack.

**`createContactSchema(messages)` pattern.** Passing translated messages as a parameter to the Zod schema factory is idiomatic, testable, and locale-agnostic. The pattern correctly separates validation logic from string resources and avoids the common mistake of hardcoding English error messages in schema definitions.

**Email locale resolution priority chain.** `src/lib/email/send.ts` resolves locale in the correct order: saved user preference → account lookup by email → journey locale → default. This handles all authentication flow states (new user, returning user, unauthenticated reset) correctly and fails safe to English.

**RTL email HTML.** `src/lib/email/templates/base.ts` correctly sets `lang`, `dir`, and inline `direction`/`text-align` CSS on the email HTML. Inline styles are the right approach for email clients that strip external stylesheets. The XSS escaping via `escapeHtml()` is present and correct.

**`generateStaticParams` in `[locale]/layout.tsx`.** Pre-rendering both locale variants at build time means Arabic pages are statically served with no runtime locale resolution latency. This is the right tradeoff for a site with a small, known set of locales.

**Route inventory and validation scripts.** The `ROUTE_INVENTORY` structure with `status`, `authBoundary`, `messagesRequired`, and `migrationBatch` fields is unusually well-considered. The accompanying `validate-route-inventory.mjs` and `check-translations.mjs` scripts as CI gates are the correct place to enforce completeness, not runtime fallbacks.

**Locale switcher UX.** Using `startTransition` for the navigation (non-blocking render) and a fire-and-forget `fetch` for persistence (non-blocking preference save) is the right approach. The component never makes the locale switch feel slow regardless of network conditions or auth state.

**`hreflang` and Open Graph metadata.** `generateLocalizedMetadata` correctly outputs canonical, `languages` (with `x-default`), OG `locale`, and OG `alternateLocale`. The `x-default` pointing to the English URL is the correct SEO behavior for a bilingual site where English is the primary language.

---

## Recommended Action Order

| Priority | Finding | Effort |
|----------|---------|--------|
| 1 | **F1** — Remove shell from `[locale]/layout.tsx` | 15 min |
| 2 | **F2** — Add Arabic font (Noto Sans Arabic or Cairo) | 30 min |
| 3 | **F4** — Reorder proxy.ts to run auth before intlProxy | 45 min |
| 4 | **F3** — Migrate email templates to consume `email.json` | 1 hour |
| 5 | **F7** — Unify `buildLocalizedPath` / `getLocalizedPathname` | 20 min |
| 6 | **F5** — Remove dead code from `resolveLocaleSwitchPathname` | 10 min |
| 7 | **F6** — Replace `useLocale() as Locale` with `isLocale` guard | 5 min |
| 8 | **F8** — Derive `OPEN_ROUTES` from `ROUTE_INVENTORY` | 30 min |
| 9 | **F9** — Add rate limiting to locale API endpoint | 20 min |
| 10 | **F12** — Manually audit AI search component strings | 30 min |
| 11 | **F10/F11** — Comment `suppressHydrationWarning`, move font variable | 10 min |

---

## Appendix: Files Reviewed

```
src/app/layout.tsx
src/app/[locale]/layout.tsx
src/app/[locale]/page.tsx
src/app/[locale]/(platform)/courses/page.tsx
src/app/[locale]/about/page.tsx
src/app/contact/contact.schema.ts
src/app/api/v1/me/locale/route.ts
src/app/sitemap.ts
src/proxy.ts
src/lib/i18n/locales.ts
src/lib/i18n/routing.ts
src/lib/i18n/messages.ts
src/lib/i18n/metadata.ts
src/lib/i18n/switch-locale.ts
src/lib/i18n/navigation.ts
src/lib/email/send.ts
src/lib/email/templates/base.ts
src/lib/email/templates/verification.ts
src/components/locale-switcher.tsx
src/components/Footer.tsx
src/components/PremiumHeaderClient.tsx
src/components/home/hero-section.tsx
src/components/home/features-section.tsx
src/messages/en/common.json
src/messages/en/email.json
src/messages/ar/common.json
src/messages/ar/email.json
drizzle/0021_user_locale.sql
scripts/check-translations.mjs
scripts/validate-route-inventory.mjs
next.config.ts
tsconfig.json
package.json
SPEC-I18N.md
specs/015-i18n-localization/spec.md
```
