# Research: Production Internationalization and Arabic Localization

**Revised**: 2026-06-02

---

## Decision: Use `next-intl` v4 for App Router i18n

**Library version**: `next-intl` **v4.x** (latest stable as of 2026-06-02). Pin to `^4.x.x` in `package.json`.

**Why v4 specifically**:
- v4 introduced the `defineRouting()` API used in `src/lib/i18n/routing.ts`. v3 used a different configuration shape — not compatible.
- v4 stabilized the `setRequestLocale()` / static rendering API, which is required for `generateStaticParams()` to work correctly with the `[locale]` segment.
- v4's `createNavigation()` exports `Link`, `useRouter`, `usePathname`, and `redirect` — the API used in `src/lib/i18n/navigation.ts`.

**Rationale**: ScholarX is a Next.js App Router application. `next-intl` v4 is the only i18n library with first-class App Router support: RSC-compatible `getTranslations()`, built-in middleware routing, `createNavigation()` for locale-aware links, and TypeScript-inferred message keys from JSON source files. All alternatives require manual workarounds for RSC.

**Primary sources**:
- next-intl v4 migration guide: https://next-intl.dev/docs/migration/v4
- next-intl routing: https://next-intl.dev/docs/routing/configuration
- next-intl RSC usage: https://next-intl.dev/docs/environments/server-client-components

**Alternatives considered**:

| Library | Why Rejected |
|---------|-------------|
| `react-i18next` | No RSC support. Pushes all translation work to client components, increasing bundle size and removing SSR translation. |
| `lingui` | Strong ICU support but requires separate codegen step and custom App Router routing integration. More setup, no RSC native support. |
| Custom dictionary loader | Eliminates dependency cost but requires building routing, navigation, fallback, metadata, and type-safe key validation manually — estimated 3–5x more engineering time. |

---

## Decision: `localePrefix: 'as-needed'` — default locale unprefixed

**Rationale**: The spec requires existing English URLs to remain stable and shareable. `as-needed` keeps `/courses` as English and adds `/ar/courses` for Arabic. This means:
- Zero broken links for existing English users.
- Independently shareable, indexable Arabic pages for SEO.
- Clear URL semantics: `/ar/*` is always Arabic, unprefixed is always English.

**Why not always-prefixed (`/en/courses`, `/ar/courses`)**:
- Breaks all existing English links and bookmarks.
- Requires extensive redirects from `/courses` → `/en/courses`.
- Creates a worse UX for the majority English audience who currently navigate without a prefix.

**Why not cookie-only routing**:
- Arabic and English pages would share the same URL.
- Not indexable as separate locale variants by search engines.
- Shared links always open in the opener's locale, not the sharer's.
- Violates the spec requirement for independently shareable localized pages.

**Why not domain-based (`ar.scholarx.eg`)**:
- More operational complexity (DNS, SSL, deployment configuration).
- Unnecessary for V2 scope.
- Cannot be added without breaking existing URLs.

---

## Decision: Route locale always wins for current page rendering

**Rationale**: A URL is a deterministic contract. The locale in the URL is what a user, search engine, or shared link expects to get. Overriding the URL-declared locale with a saved preference creates unpredictable behavior: a shared Arabic link opens in English for an English-preference user. This violates user trust and makes links non-reproducible.

**What preference controls**:
- The default locale when the user navigates to a new page without a locale prefix.
- The locale used for transactional emails.
- The pre-filled selection in the language switcher UI.

**What preference does NOT control**:
- The locale of the current page when a URL is directly requested.

---

## Decision: Release-owned route inventory as scope gate

**Rationale**: The app has 45+ routes spanning public, authenticated, admin, API, and diagnostic surfaces. Without an explicit inventory:
- A route migration might accidentally localize an admin page.
- A new page might ship without Arabic coverage.
- QA cannot systematically verify Arabic routes because the scope is undefined.

The inventory (`contracts/route-inventory.md`) is validated in CI by `pnpm i18n:validate-routes` on every PR.

---

## Decision: Namespace-scoped JSON message files, English as canonical source

**Rationale**: Feature-scoped namespaces (home, auth, courses, etc.) map to existing product ownership boundaries. This allows:
- Per-page message bundle loading (no cross-namespace bundling).
- Clear ownership for translation reviews.
- Incremental translation — translate auth before courses if needed.
- `pnpm i18n:check` compares Arabic against English namespace-by-namespace.

**Why not a single large locale file**: Harder to review, split, load by page, and assign to translators. Rejected.
**Why not component-local files**: Encourages key duplication and makes coverage validation harder. Rejected.
**Why not database-managed messages**: Higher operational overhead than V2 requires. Translator-facing CMS is out of V2 scope. Rejected.

---

## Decision: `auth.user.locale` as nullable text column

**Rationale**: Authenticated preference needs durable storage. The `auth.user` table is the correct ownership boundary. Using `text` instead of a DB `enum`:
- Adding `'fr'` or `'de'` in V3 requires only: (1) add to `SUPPORTED_LOCALES`, (2) add to `LOCALE_CONFIG`, (3) add message files. No DB migration required.
- `isLocale()` type guard at the application layer provides the constraint.

---

## Decision: Localized email templates in the email boundary, not in auth callbacks

**Rationale**: The current auth callbacks (`src/lib/auth.ts`) contain hardcoded English strings. Extracting these into template functions:
- Keeps auth callbacks thin (single responsibility).
- Centralizes email template ownership in `src/lib/email/templates/`.
- Makes it possible to validate email output (unit-testable functions).
- Decouples locale resolution from the auth framework.

The downstream delivery service (Nodemailer) is unchanged.

---

## Decision: Tailwind logical properties + targeted RTL visual gates

**Rationale**: Arabic RTL support does not require a UI redesign. Tailwind CSS 4 provides logical property utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `text-end`, `start-*`, `end-*`, `rounded-s-*`, `rounded-e-*`) that resolve correctly based on the document's `dir` attribute. The implementation strategy is:
1. Audit existing components for physical-direction Tailwind classes.
2. Replace with logical equivalents in the `[locale]` route group.
3. Flip directional icons (chevrons, arrows) with `rtl:rotate-180`.
4. Validate with visual regression snapshots.

**Why not a global CSS mirror (`transform: scaleX(-1)`)**: Too blunt. Mirrors images, charts, and content that should not be mirrored. Rejected.

---

## Decision: Staged Arabic enablement with production gap reporting

**Rationale**: Localization failures should not block critical journeys (authentication, enrollment). The two-layer approach:
- **Pre-launch gate** (`pnpm i18n:check`): blocks Arabic exposure if required keys are missing. This is the high-confidence gate.
- **Production fallback**: if a key is somehow missing at runtime (race condition, deployment error), fall back to English silently and log a gap record to Sentry. Do not crash or show a raw key.

The gap record must never include OTP values, session tokens, or reset URLs.

---

## Security Research Notes

### Locale Injection

Any value from an external source (URL segment, cookie, query param, request body) that is treated as a locale must pass through `isLocale()` before use. The middleware's `notFound()` call for invalid `[locale]` segments is the primary defense. The preference update API's `isLocale()` check before DB write is the secondary defense.

**Threat**: An attacker crafts a URL or cookie with a long or malformed locale string hoping to trigger a path traversal or log injection. `isLocale()` rejects any value not in `['en', 'ar']`.

### XSS via Translation Strings

`next-intl`'s default render path escapes all message values. The only XSS risk is from `t.rich()` calls that pass user-controlled content through a tag function — which does not apply here because translation strings are static JSON files, not user-supplied. Rich text is used only for static markup (bold, links), never for user data.

**Rule**: Never interpolate user-supplied data as a key into a translation function. Translation functions receive static keys; user data is passed as ICU interpolation variables.

### Cookie Security

The `NEXT_LOCALE` cookie stores only a locale code. Even if stolen or forged, the worst case is a language change. `SameSite=Lax` prevents cross-site CSRF for this cookie. `Secure` in production prevents transmission over HTTP.

### Email OTP Logging

The `otp` and `resetUrl` variables must not be logged. Template functions are unit-tested to confirm these values don't appear in any catch/error path. The gap reporting contract explicitly prohibits including these values in gap records.
