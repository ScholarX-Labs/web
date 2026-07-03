# Contract: Locale Preference

**Version**: 1.0.0
**Owner**: Engineering
**Last Updated**: 2026-06-02

---

## Purpose

Define the exact behavior of visitor and authenticated locale preferences — including how they are stored, read, used, and secured — without overriding the requested route locale for the current page view.

---

## Locale Resolution Order

### For Page Rendering (Route is Always Authoritative)

```
1. URL prefix present and valid → use it
   /ar/courses  → locale: ar
   /courses     → locale: en (default unprefixed)

2. URL prefix invalid or unsupported
   /xyz/courses → 404 (never treat as locale)
```

The saved preference and visitor cookie are **never consulted** for page rendering. They only affect where the user ends up if they click the language switcher.

### For Non-Route Contexts (Transactional Email, Background Jobs)

```
1. Authenticated user's auth.user.locale (if user exists and is valid locale)
2. Active journey locale (locale from the request context that triggered the operation)
3. Visitor locale cookie (if available and valid)
4. 'en' (English fallback — always available)
```

---

## Visitor Preference (Cookie)

### Cookie Specification

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| Name | `NEXT_LOCALE` | Required by `next-intl` default configuration |
| Value | `'en'` \| `'ar'` | Validated locale code only — no other data |
| `HttpOnly` | `false` | Required — client JS must read the current locale |
| `SameSite` | `Lax` | Prevents CSRF via cross-site form submission; allows top-level navigation |
| `Secure` | `true` (production) / `false` (development) | Prevents transmission over HTTP in production |
| `Path` | `/` | Available site-wide |
| `Max-Age` | `31536000` (1 year) | Persist explicit choice across sessions |
| `Domain` | Not set | Scoped to the current domain; prevents subdomain leakage |

### Privacy Rules

The `NEXT_LOCALE` cookie MUST contain only the locale code string (`'en'` or `'ar'`).

**Prohibited content**:
- User ID or username
- Session ID or auth token
- Email address
- Route history or referring URL
- Personally identifiable information of any kind

**Why `HttpOnly: false`**: The locale switcher component needs to read the current cookie value on the client to determine the active locale and set the `aria-current` state correctly. This is a deliberate, documented exception to the general preference for `HttpOnly` cookies.

### Failure Behavior

If cookie writes fail (browser policy, storage quota, incognito mode):
- Language switching still completes (route navigation fires first).
- The cookie failure is silent — no error is shown to the user.
- On the next page load, if no cookie is present, the route locale is used.

---

## Authenticated Preference (Database)

### Schema

```sql
ALTER TABLE "user" ADD COLUMN "locale" TEXT DEFAULT 'en';
```

```typescript
// src/db/schema/auth-schema.ts
locale: text("locale").default("en"),
```

**Design decision**: `text` not `enum` — adding `'fr'` or `'de'` in V3 requires no schema migration, only application-layer addition to `SUPPORTED_LOCALES`.

### Read Path

The locale is read:
1. By `resolveEmailLocale()` when generating a transactional email.
2. By the language switcher to pre-fill the "current" selection on authenticated sessions.
3. By the profile page to display the user's current preference.

### Write Path (API Endpoint)

```
PATCH /api/v1/me/locale
Content-Type: application/json
Body: { "locale": "ar" }

Response 200: { "locale": "ar" }
Response 400: { "error": "Invalid locale" }
Response 401: { "error": "Unauthorized" }
```

**Security requirements for this endpoint** (SR-006 in spec):
- Requires a valid authenticated session (Better Auth session check). Return 401 if not authenticated.
- Validates `body.locale` with `isLocale()` before any database operation. Return 400 for invalid values. This prevents locale injection.
- No rate limiting beyond standard API rate limits is required because this is a low-frequency operation.
- Response body MUST NOT include session tokens, user email, or other private session fields.
- `updatedAt` on the `user` row is refreshed on successful update.

### Update Contract

```typescript
interface LocaleUpdateRequest {
  locale: string; // validated to Locale before DB write
}

interface LocaleUpdateResponse {
  locale: Locale;
}
```

---

## Route Override Rule (Critical)

**A directly requested URL always controls the locale for that page view.**

Scenario: user saved preference is `'ar'`, user opens `/courses` directly.
- Result: page renders in English.
- Saved preference: unchanged — still `'ar'`.
- No redirect is issued.
- On next language switch, the switcher shows Arabic as the saved preference.

This rule exists because:
1. Shared links must produce predictable results regardless of recipient's saved preference.
2. Auto-redirecting based on preference violates FR-002 (existing English routes must remain stable).
3. It matches user expectation: "I deliberately opened an English URL."

---

## Language Switch Sequence

When a user clicks the language switcher:

```
1. switchLocale(newLocale) called
2. router.replace(currentPathname, { locale: newLocale }) — FIRES IMMEDIATELY
3. next-intl sets NEXT_LOCALE cookie — SYNCHRONOUS
4. fetch('PATCH /api/v1/me/locale', { locale: newLocale }) — ASYNC, fire-and-forget
5. User is already on the new route before step 4 completes
```

Step 4 failure does not affect steps 1–3. The user sees the new locale immediately.

---

## Preference State Matrix

| Scenario | Route | Cookie | DB pref | Page renders |
|----------|-------|--------|---------|-------------|
| New visitor, no preference | `/courses` | — | — | English |
| New visitor, no preference | `/ar/courses` | — | — | Arabic |
| Visitor chose Arabic | `/courses` | `ar` | — | English (route wins) |
| Visitor chose Arabic | `/ar/courses` | `ar` | — | Arabic |
| Auth user, pref = Arabic | `/courses` | — | `ar` | English (route wins) |
| Auth user, pref = Arabic | `/ar/courses` | — | `ar` | Arabic |
| Auth user, no pref | `/courses` | — | `en` (default) | English |
| Auth user switches to Arabic | `/courses` → switch | `ar` (after) | `ar` (after) | Arabic (after navigation) |

---

## CSRF Considerations

The `PATCH /api/v1/me/locale` endpoint:
- Requires `Content-Type: application/json` (prevents form-based CSRF submissions).
- Uses Better Auth session cookie — which is `SameSite=Lax` by default, preventing cross-site forgery for top-level navigation.
- Updates only the `locale` field — even if somehow forged, the impact is limited to changing the user's language preference to a valid locale code.

No additional CSRF token is required for this endpoint.
