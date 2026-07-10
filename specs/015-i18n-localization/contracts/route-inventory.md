# Contract: Localized Route Inventory

**Version**: 1.0.0
**Owner**: Engineering Lead + Product
**Last Updated**: 2026-06-02

---

## Purpose

The route inventory is the release-owned source of truth for which routes are localized, excluded, or deferred in V2. It prevents accidental admin/API localization, prevents missing Arabic coverage, and drives QA assignment. Every `src/app/**/page.tsx` file MUST have exactly one inventory entry before Arabic broad exposure is allowed.

---

## Status Values

| Status | Meaning |
|--------|---------|
| `localized` | Both English (unprefixed) and Arabic (`/ar`-prefixed) variants are required. |
| `english_only` | English route exists; Arabic variant intentionally not provided in V2. |
| `admin_only` | Internal admin surface. MUST NOT be localized. MUST NOT have an Arabic path. |
| `api_only` | Service endpoint or webhook. MUST NOT be localized or appear in sitemap. |
| `diagnostic_only` | Internal test/diagnostic route. MUST NOT be localized. |
| `deferred` | Explicitly out of V2 scope; planned for a future release. |

---

## Auth Boundary Values

| Value | Meaning |
|-------|---------|
| `public` | No authentication required. |
| `authenticated` | Requires a valid user session. |
| `admin` | Requires admin role. |
| `api` | Service-to-service; not user-facing. |
| `internal` | Internal infrastructure; not externally accessible. |

---

## Required Fields

| Field | Required | Description |
|-------|----------|-------------|
| `routeId` | Yes | Stable identifier. Never changes after assignment. Format: `domain.variant` |
| `englishPath` | Yes | Default English path (unprefixed). |
| `arabicPath` | Required for `localized` | Arabic-prefixed path. Must begin with `/ar`. |
| `status` | Yes | Route localization status. |
| `authBoundary` | Yes | Access and data boundary. |
| `messagesRequired` | Yes | Message namespaces required by the route. Must be a subset of defined namespaces. |
| `metadataRequired` | Yes | Whether localized `<title>`, `<meta>`, `hreflang`, OG are required. |
| `visualQaRequired` | Yes | Whether RTL visual QA is required before Arabic exposure. |
| `migrationBatch` | Yes | Implementation batch (A–E) from `plan.md`. |
| `notes` | No | Scope, migration, or ownership notes. |

---

## V2 Route Inventory

| Route ID | English Path | Arabic Path | Status | Boundary | Messages | Metadata | Visual QA | Batch |
|----------|--------------|-------------|--------|----------|----------|----------|-----------|-------|
| `home` | `/` | `/ar` | `localized` | `public` | `common`, `home`, `metadata` | Yes | Yes | A |
| `about` | `/about` | `/ar/about` | `localized` | `public` | `common`, `about`, `metadata` | Yes | Yes | A |
| `contact` | `/contact` | `/ar/contact` | `localized` | `public` | `common`, `contact`, `metadata` | Yes | Yes | A |
| `courses.index` | `/courses` | `/ar/courses` | `localized` | `public` | `common`, `courses`, `metadata` | Yes | Yes | B |
| `courses.detail` | `/courses/[slug]` | `/ar/courses/[slug]` | `localized` | `public` | `common`, `courses`, `metadata` | Yes | Yes | B |
| `courses.lessons` | `/courses/[slug]/lessons` | `/ar/courses/[slug]/lessons` | `localized` | `authenticated` | `common`, `courses` | No | Yes | C |
| `courses.lessonDetail` | `/courses/[slug]/lessons/[lessonId]` | `/ar/courses/[slug]/lessons/[lessonId]` | `localized` | `authenticated` | `common`, `courses` | No | Yes | C |
| `opportunities.index` | `/opportunities` | `/ar/opportunities` | `localized` | `public` | `common`, `opportunities`, `metadata` | Yes | Yes | B |
| `opportunities.detail` | `/opportunity/[id]` | `/ar/opportunity/[id]` | `localized` | `public` | `common`, `opportunities`, `metadata` | Yes | Yes | B |
| `certificates.index` | `/certificates` | `/ar/certificates` | `localized` | `authenticated` | `common`, `certificates` | No | Yes | C |
| `certificates.verify` | `/certificates/[certificateNumber]` | `/ar/certificates/[certificateNumber]` | `localized` | `public` | `common`, `certificates`, `metadata` | Yes | Yes | C |
| `certificates.download` | `/certificates/[certificateNumber]/download` | — | `english_only` | `authenticated` | — | No | No | — |
| `aiSearch.index` | `/ai-search` | `/ar/ai-search` | `localized` | `public` | `common`, `aiSearch`, `metadata` | Yes | Yes | E |
| `profile.index` | `/profile` | `/ar/profile` | `localized` | `authenticated` | `common`, `profile` | No | Yes | D |
| `scholar.publicProfile` | `/scholar/[username]` | `/ar/scholar/[username]` | `localized` | `public` | `common`, `profile`, `metadata` | Yes | Yes | D |
| `auth.signup` | `/auth/signup` | `/ar/auth/signup` | `localized` | `public` | `common`, `auth` | No | Yes | D |
| `auth.signin` | `/auth/signin` | `/ar/auth/signin` | `localized` | `public` | `common`, `auth` | No | Yes | D |
| `auth.forgotPassword` | `/auth/forgot-password` | `/ar/auth/forgot-password` | `localized` | `public` | `common`, `auth` | No | Yes | D |
| `auth.resetPassword` | `/auth/reset-password` | `/ar/auth/reset-password` | `localized` | `public` | `common`, `auth` | No | Yes | D |
| `auth.verifyEmail` | `/auth/verify-email` | `/ar/auth/verify-email` | `localized` | `public` | `common`, `auth` | No | Yes | D |
| `auth.collectPhone` | `/auth/collect-phone` | `/ar/auth/collect-phone` | `localized` | `public` | `common`, `auth` | No | Yes | D |
| `admin.*` | `/admin/*` | — | `admin_only` | `admin` | — | No | No | — |
| `api.*` | `/api/*` | — | `api_only` | `api` | — | No | No | — |
| `ingest.*` | `/ingest/*` | — | `api_only` | `internal` | — | No | No | — |
| `sentryTest` | `/sentry-test` | — | `diagnostic_only` | `internal` | — | No | No | — |

---

## Dynamic Route Identifier Rules (V2)

- Dynamic path segments (`[slug]`, `[id]`, `[username]`, `[lessonId]`, `[certificateNumber]`) are **shared across locales** in V2.
- An English course at `/courses/intro-to-python` is also accessible at `/ar/courses/intro-to-python`.
- Locale-specific slugs are deferred to V3 (requires a `course_translations` table).

---

## Redirect Rules

No 301/302 redirects are introduced for existing English routes. The `localePrefix: 'as-needed'` strategy means:
- `/courses` → English (no redirect).
- `/ar/courses` → Arabic (direct render).
- A user with an `ar` cookie preference visiting `/courses` → **stays at** `/courses` (English), no redirect.

The only redirect that may occur is: a user with an `ar` preference who lands on a path that `next-intl` middleware determines should be prefixed — but only if the route itself is Arabic-prefixed and the user explicitly navigated there.

---

## Inventory Versioning

The inventory version is a semantic version managed in the table header of this file.

**Breaking changes** (bump major):
- Removing a `localized` route entry.
- Changing `authBoundary` from `public` to `authenticated` for a `localized` route.
- Removing a required message namespace from a `localized` route.

**Non-breaking changes** (bump minor):
- Adding a new `localized` route.
- Adding a `notes` field.
- Changing `visualQaRequired` from `false` to `true`.

**Patch changes** (bump patch):
- Correcting typos in path, notes.
- Updating migration batch assignment.

---

## Inventory Validation (CI Gate)

A CI script validates the inventory on every PR:

```typescript
// scripts/validate-route-inventory.ts
// 1. Reads all src/app/**/page.tsx paths
// 2. Checks each has exactly one entry in route-inventory.md
// 3. Checks every 'localized' entry has arabicPath starting with '/ar'
// 4. Checks no 'admin_only' / 'api_only' / 'diagnostic_only' entry has arabicPath
// 5. Checks metadata namespaces only appear on public localized routes
// 6. Exits with code 1 on any violation
```

Add to `package.json`:
```json
"i18n:validate-routes": "node --import tsx scripts/validate-route-inventory.ts"
```

This script runs in CI alongside `pnpm i18n:check`.

---

## Validation Rules (Summary)

1. Every `src/app/**/page.tsx` route must appear in the inventory.
2. Every `localized` entry must define both `englishPath` and `arabicPath`.
3. `arabicPath` must begin with `/ar`.
4. `admin_only`, `api_only`, and `diagnostic_only` entries must not define `arabicPath`.
5. `metadata` namespace must only appear in `messagesRequired` for public `localized` entries.
6. Dynamic identifiers are shared across locales in V2 (no separate slug per locale).
7. No new `localized` route may be added without a corresponding message namespace listing.
8. `certificates.download` (`/certificates/[id]/download`) is `english_only` — it is a file delivery endpoint, not a user-browsable page.
