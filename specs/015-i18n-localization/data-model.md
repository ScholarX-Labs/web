# Data Model: Production Internationalization and Arabic Localization

**Revised**: 2026-06-02

This document defines entities, TypeScript interfaces, validation rules, and relationships for the i18n feature. All TypeScript interfaces in this document are the authoritative contracts — implementation files must match exactly.

---

## Entity Relationships

```
Locale ──────────────── defines ────────────────────► LocaleConfig
  │
  ├── resolved from ──────────────────────────────► RouteLocale
  │
  ├── maps to ─────────────────────────────────────► LocalizedRouteInventoryEntry
  │                                                       │
  │                                                       └── requires ──► MessageNamespace[]
  │
  ├── key for ───────────────────────────────────────► MessageCatalog
  │                                                       │
  │                                                       └── validated by ──► TranslationCoverageRecord
  │
  ├── stored in ──────────────────────────────────────► UserLocalePreference
  │
  ├── stored in (visitor) ──────────────────────────► VisitorLocaleChoice
  │
  └── used by ─────────────────────────────────────────► TransactionalMessageTemplate
                                                          LocalizedMetadata
                                                          LocalizationGap
```

---

## Locale

The canonical list of supported user-facing languages. The TypeScript `Locale` type is derived from the runtime constant — no duplication.

```typescript
// src/lib/i18n/locales.ts

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

export interface LocaleConfig {
  readonly code: Locale;
  /** Short display label shown in the locale switcher */
  readonly label: string;
  /** Full native language name for accessibility / aria-label */
  readonly nativeLabel: string;
  /** Layout direction for this locale */
  readonly dir: 'ltr' | 'rtl';
  /** Whether this is the default unprefixed locale */
  readonly isDefault: boolean;
  /** BCP-47 tag for <html lang>, OG locale, email lang attributes */
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
```

**Validation Rules**:
- Exactly one locale must have `isDefault: true`.
- All RTL locales must have `dir: 'rtl'`.
- `bcp47Tag` must be a valid BCP-47 language tag (IANA registry).
- V3 addition of `fr` / `de` requires: add to `SUPPORTED_LOCALES`, add to `LOCALE_CONFIG`. No DB migration required.

---

## RouteLocale

Represents the locale resolved from the current request's URL.

```typescript
// src/lib/i18n/routing.ts (internal type)

export type LocaleSource =
  | 'prefix'           // /ar/courses → locale: 'ar'
  | 'default-unprefixed' // /courses → locale: 'en'
  | 'internal-rewrite';  // next-intl internal rewrite

export interface RouteLocale {
  locale: Locale;
  source: LocaleSource;
  /** Normalized pathname without locale prefix */
  pathname: string;
  /** Whether this locale/path combination is in the route inventory */
  isInScope: boolean;
}
```

**Validation Rules**:
- `/ar/*` resolves to `ar` only for in-scope localized routes.
- Unprefixed supported user-facing routes resolve to `en`.
- An unsupported prefix (e.g., `/xyz/`) must result in `isInScope: false` → 404.
- Admin, API, ingest, and diagnostics routes MUST NOT be processed as localized routes.

---

## LocalizedRouteInventoryEntry

Release-owned classification for every page route. The inventory is the authoritative scope gate.

```typescript
// src/lib/i18n/route-inventory.ts

export type RouteStatus =
  | 'localized'       // English + Arabic variants required
  | 'english_only'    // English only; Arabic not provided in V2
  | 'admin_only'      // Internal admin; must not be localized
  | 'api_only'        // Service endpoint; must not be localized
  | 'diagnostic_only' // Internal diagnostic; must not be localized
  | 'deferred';       // Explicitly out of V2 scope

export type AuthBoundary = 'public' | 'authenticated' | 'admin' | 'api' | 'internal';

export type MessageNamespaceKey =
  | 'common'
  | 'home'
  | 'auth'
  | 'courses'
  | 'certificates'
  | 'opportunities'
  | 'profile'
  | 'about'
  | 'contact'
  | 'aiSearch'
  | 'metadata'
  | 'email';

export interface LocalizedRouteInventoryEntry {
  /** Stable identifier — never changes after assignment */
  routeId: string;
  /** Default English path (unprefixed) */
  englishPath: string;
  /** Arabic-prefixed path — required when status is 'localized' */
  arabicPath?: string;
  status: RouteStatus;
  authBoundary: AuthBoundary;
  messagesRequired: MessageNamespaceKey[];
  /** Whether this route requires localized <title>, <meta>, hreflang */
  metadataRequired: boolean;
  /** Whether this route requires RTL visual QA */
  visualQaRequired: boolean;
  /** Migration batch (A-E) for implementation ordering */
  migrationBatch?: 'A' | 'B' | 'C' | 'D' | 'E';
  notes?: string;
}
```

**Invariants** (enforced by `scripts/check-translations.ts` + CI):
- Every `src/app/**/page.tsx` route has exactly one `LocalizedRouteInventoryEntry`.
- Every `localized` entry defines both `englishPath` and `arabicPath`.
- `admin_only`, `api_only`, `diagnostic_only` entries MUST NOT define `arabicPath`.
- `metadata.json` is only in `messagesRequired` for public `localized` entries.
- Dynamic identifiers (slugs, IDs) are shared across locales in V2.

---

## MessageNamespace

Logical grouping of user-facing strings with ownership and usage tracking.

```typescript
// src/lib/i18n/messages.ts (documentation type — not at runtime)

export interface MessageNamespace {
  /** Stable namespace identifier — matches JSON file name */
  namespace: MessageNamespaceKey;
  /** Team or individual accountable for copy changes */
  owner: string;
  /** Route IDs that use this namespace */
  requiredForRoutes: string[];
  /**
   * Whether this namespace uses next-intl rich text rendering.
   * Rich text namespaces must NEVER use raw HTML strings.
   */
  allowsRichText: boolean;
  /** Whether runtime variable interpolation is used */
  allowsInterpolation: boolean;
  /**
   * Named interpolation variables used in this namespace.
   * Must be stable identifiers — renaming is a breaking change.
   */
  interpolationVariables?: string[];
}
```

**Key Conventions**:
- Namespace names are `camelCase` or lowerCamel domain terms — stable identifiers.
- Keys are `camelCase`, max 2 nesting levels deep: `enrollment.buttonLabel`.
- Interpolation variable names are semantic: `{courseName}`, `{otp}`, `{expiryMinutes}`. Never use positional variables.
- Rich text uses `next-intl` tag format: `t.rich('key', { b: (chunks) => <strong>{chunks}</strong> })`. Never raw HTML strings.

---

## MessageCatalog

Versioned, locale-specific collection of messages.

```typescript
export interface MessageCatalog {
  locale: Locale;
  /** Semantic version of this catalog (matches git tag at approval) */
  version: string;
  /** Namespaces included in this catalog */
  namespaces: Record<MessageNamespaceKey, Record<string, unknown>>;
  /**
   * Required for Arabic before production exposure.
   * null = not yet approved.
   */
  approvedAt: string | null;
  approvedBy: string | null;
}
```

**Validation Rules**:
- English catalog is the canonical key source.
- Arabic catalog must contain all required English keys for in-scope routes before broad exposure.
- Production fallback MUST NOT display raw keys, placeholder names (`__NEEDS_TRANSLATION__`), or internal identifiers.
- ICU message syntax (plurals, select) must be validated against the ICU spec before release.

---

## TranslationCoverageRecord

Output of the coverage validation script.

```typescript
export type CoverageStatus = 'pass' | 'warning' | 'fail';

export interface TranslationCoverageRecord {
  locale: Locale;
  namespace: MessageNamespaceKey;
  totalRequiredKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  /** Keys in locale file that have no counterpart in the English source */
  extraKeys: string[];
  /** Keys that exist but have stub/placeholder values */
  stubKeys: string[];
  status: CoverageStatus;
  checkedAt: string;
}
```

**Severity Rules**:
- `missingKeys.length > 0` → `fail` (release blocker for Arabic enablement).
- `stubKeys.length > 0` → `fail` (keys with `__NEEDS_TRANSLATION__` are equivalent to missing).
- `extraKeys.length > 0` → `warning` (stale or unused keys; not a blocker).
- Arabic enablement requires `pass` for ALL namespaces listed in `messagesRequired` for every `localized` route.

---

## UserLocalePreference

Durable, authenticated user language preference stored in the database.

```typescript
// Drizzle schema addition to auth.user table:
// locale: text("locale").default("en")

export type LocalePreferenceSource =
  | 'language_switcher'
  | 'signup_context'
  | 'profile_update'
  | 'admin_correction';

export interface UserLocalePreference {
  userId: string;
  locale: Locale;
  updatedAt: Date;
  source: LocalePreferenceSource;
}
```

**Validation Rules**:
- `locale` MUST pass `isLocale()` before writing to the database.
- Preference update MUST require an authenticated session.
- Preference MUST NOT override the locale of a directly-requested route for the current page view.
- DB column is `text` not `enum` — adding `'fr'` requires no migration.

---

## VisitorLocaleChoice

Best-effort locale preference for signed-out visitors, persisted as a cookie.

```typescript
export interface VisitorLocaleChoice {
  locale: Locale;
  /** Cookie name — must match next-intl's configured cookie name */
  readonly cookieName: 'NEXT_LOCALE';
  /** 1 year in seconds */
  readonly maxAge: 31536000;
  readonly sameSite: 'Lax';
  readonly secure: true; // production only
  readonly httpOnly: false; // must be readable by client JS for switcher state
  readonly path: '/';
}
```

**Privacy Rules**:
- Cookie value is the locale code string only (`'en'` or `'ar'`).
- MUST NOT contain: user ID, session ID, email address, route history, or any personal data.
- Cookie failure MUST NOT block navigation or language switching.

---

## LanguageSwitchAction

Represents a single user-initiated locale change event.

```typescript
export type SwitchResolution =
  | 'equivalent_route'  // /ar/courses ↔ /courses
  | 'fallback_route'    // current route has no equivalent; navigated to home/safe destination
  | 'unsupported';      // locale not in supported list (should never reach switcher UI)

export interface LanguageSwitchAction {
  fromLocale: Locale;
  toLocale: Locale;
  fromPath: string;
  /** Resolved navigation destination */
  toPath: string;
  resolution: SwitchResolution;
  /** Whether the preference was durably saved */
  persisted: boolean;
  /** Whether the navigation itself completed */
  navigationCompleted: boolean;
}
```

**Invariants**:
- `navigationCompleted` MUST be `true` regardless of `persisted` value.
- Switching to English produces an unprefixed `toPath` (no `/en/` prefix).
- Switching to Arabic produces an `/ar/`-prefixed `toPath`.
- `resolution === 'fallback_route'` MUST result in a valid page, not a 404.

---

## TransactionalMessageTemplate

Localized account-related email message.

```typescript
export type EmailTemplateId =
  | 'email_verification_otp'
  | 'signin_otp'
  | 'password_reset'
  | 'email_change';

export interface TransactionalMessageTemplate {
  templateId: EmailTemplateId;
  locale: Locale;
  direction: 'ltr' | 'rtl';
  subject: string;
  /** Plain-text body — mandatory; understandable without HTML */
  text: string;
  /** Optional HTML body — must declare lang and dir; all variables escaped */
  html?: string;
  /** Variables available to the template — must be escaped before HTML interpolation */
  variables: EmailTemplateVariables;
}

export interface EmailTemplateVariables {
  /** One-time code for OTP templates. MUST NOT be logged. */
  otp?: string;
  /** Expiry duration in minutes */
  expiryMinutes?: number;
  /** Password reset URL. MUST be escaped in HTML output. */
  resetUrl?: string;
}
```

**Security Rules**:
- All `variables` values MUST be HTML-escaped before interpolation into `html`.
- `otp` and `resetUrl` MUST NOT appear in any server log, error trace, or gap report.
- `html` MUST set `lang` and `dir` attributes on the root `<html>` element.
- `text` is required and must be a self-contained, actionable message without HTML.

---

## LocalizedMetadata

SEO and sharing metadata for a localized public page.

```typescript
export interface LocalizedMetadata {
  routeId: string;
  locale: Locale;
  /** Localized page title — must not contain raw variable keys */
  title: string;
  /** Localized page description */
  description: string;
  /** Canonical URL for this locale */
  canonicalPath: string;
  /** hreflang alternates for all supported locales */
  alternates: Record<Locale | 'x-default', string>;
  /** Open Graph locale string (e.g., 'ar_EG', 'en_US') */
  ogLocale: string;
}
```

**Validation Rules**:
- `alternates` MUST include entries for `'en'`, `'ar'`, and `'x-default'`.
- `alternates['x-default']` MUST be the English (default) path.
- Metadata MUST NOT be generated for `admin_only`, `api_only`, or `diagnostic_only` routes.
- Metadata MUST NOT include private user data, session identifiers, or internal route context.

---

## LocalizationGap

A classifiable quality issue detected at release-time or in production.

```typescript
export type GapType =
  | 'missing_translation'     // A required key has no Arabic value
  | 'stub_translation'        // Key exists but has a placeholder value
  | 'unsupported_locale_request' // Request with an unrecognized locale prefix
  | 'rtl_layout_regression'   // Visual defect in RTL layout
  | 'metadata_gap'            // Missing or incorrect hreflang/OG metadata
  | 'email_gap'               // Missing or incorrect email template output
  | 'accessibility_gap';      // Missing lang, dir, label, or focus-order issue

export type GapSeverity =
  | 'release_blocker' // Blocks Arabic broad exposure
  | 'user_visible'    // Degrades user experience; triage within 1 business day post-launch
  | 'warning'         // Noted for follow-up; does not block launch or SLA
  | 'informational';  // Operational telemetry only

export type GapStatus = 'open' | 'triaged' | 'resolved' | 'deferred';

export interface LocalizationGap {
  gapId: string;
  type: GapType;
  severity: GapSeverity;
  /** Route inventory ID of affected route, if applicable */
  routeId?: string;
  locale: Locale;
  /** Namespace of the missing translation, if applicable */
  namespace?: MessageNamespaceKey;
  detectedAt: Date;
  status: GapStatus;
  /**
   * Human-readable description of the gap.
   * MUST NOT contain OTP values, session tokens, user emails,
   * password reset URLs, or other private data.
   */
  description: string;
}
```

**Severity Mapping**:

| Gap Type | Default Severity |
|----------|-----------------|
| `missing_translation` (pre-launch, in-scope) | `release_blocker` |
| `missing_translation` (runtime fallback) | `user_visible` |
| `stub_translation` (pre-launch) | `release_blocker` |
| `unsupported_locale_request` | `informational` |
| `rtl_layout_regression` (major — blocks task) | `release_blocker` |
| `rtl_layout_regression` (minor — cosmetic) | `user_visible` |
| `metadata_gap` | `warning` |
| `email_gap` | `user_visible` |
| `accessibility_gap` (critical — screen reader) | `release_blocker` |
| `accessibility_gap` (minor) | `warning` |

---

## LocaleFallbackChain

The ordered resolution chain used when determining which locale to apply for a non-route context (account messages, preference reads).

```typescript
export interface LocaleFallbackChain {
  /** 1. Saved authenticated user preference from auth.user.locale */
  authenticatedPreference: Locale | null;
  /** 2. Locale inferred from the active auth/account journey URL */
  journeyLocale: Locale | null;
  /** 3. Visitor cookie preference */
  visitorCookie: Locale | null;
  /** 4. Always available fallback */
  readonly defaultFallback: typeof DEFAULT_LOCALE;
}

export function resolveLocaleFromChain(chain: LocaleFallbackChain): Locale {
  return (
    chain.authenticatedPreference ??
    chain.journeyLocale ??
    chain.visitorCookie ??
    chain.defaultFallback
  );
}
```

**Note**: This chain is used ONLY for contexts where there is no URL to derive locale from (transactional emails, background jobs). For page rendering, the route URL is always the authoritative source — this chain is never consulted.
