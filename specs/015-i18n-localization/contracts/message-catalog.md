# Contract: Message Catalog and Translation Coverage

**Version**: 1.0.0
**Owner**: Engineering + Content/Product
**Last Updated**: 2026-06-02

---

## Purpose

Define how user-facing strings are organized, authored, validated, approved, and released for English and Arabic. Establish rules that prevent runtime key exposure, message injection, and coverage gaps at launch.

---

## Catalog Location

```
src/messages/
├── en/
│   ├── common.json       ← navigation, buttons, shared errors, locale switcher labels
│   ├── home.json         ← home page hero, features, stats, CTAs
│   ├── auth.json         ← sign-in, sign-up, forgot/reset password, verify email, OTP
│   ├── courses.json      ← course listing, detail, application form, enrollment, lessons
│   ├── certificates.json ← certificate listing, verification, download labels
│   ├── opportunities.json ← opportunity listing, detail, application
│   ├── profile.json      ← user profile, scholar profile
│   ├── about.json        ← about page hero, mission, founder, impact
│   ├── contact.json      ← contact form, labels, success/error states
│   ├── aiSearch.json     ← AI search page labels, error messages, results UI
│   ├── metadata.json     ← page titles and meta descriptions for public localized routes
│   └── email.json        ← transactional email subjects and bodies (used server-side only)
└── ar/
    └── (same files, same keys, Arabic values)
```

---

## Namespace Ownership

| Namespace | Owner | Notes |
|-----------|-------|-------|
| `common` | Frontend Engineering | Changes require review across all routes |
| `home` | Content / Product | Marketing copy |
| `auth` | Frontend Engineering | Security-sensitive flows |
| `courses` | Product + Engineering | User journey critical |
| `certificates` | Engineering | |
| `opportunities` | Product + Engineering | |
| `profile` | Engineering | |
| `about` | Content / Product | Marketing copy |
| `contact` | Content / Product | |
| `aiSearch` | Engineering | |
| `metadata` | SEO + Product | Changes affect search ranking |
| `email` | Engineering + Content | Transactional; security-sensitive |

---

## Key Naming Rules

1. **Stable identifiers**: Once a key ships to production, its name MUST NOT change without a migration plan. Renaming a key is equivalent to deleting the old key and adding a new one — both English and Arabic files must be updated atomically.
2. **`camelCase` keys**: `buttonLabel`, `hero.title`, `enrollment.successMessage`.
3. **Max 2 nesting levels**: `enrollment.buttonLabel` is allowed. `enrollment.state.active.label` is not.
4. **No index-based keys**: `step0`, `step1` are banned. Use `steps.personal`, `steps.education`.
5. **Semantic interpolation variables**: `{courseName}`, `{otp}`, `{expiryMinutes}`. Never positional like `{0}`, `{1}`.
6. **Plural forms use ICU syntax**: `{count, plural, one {# course} other {# courses}}`.
7. **No HTML in standard keys**: Use `next-intl` rich text API for any key that requires inline formatting.

---

## Rich Text Rules

Rich text is allowed only through `t.rich()` with structured tag functions. Raw HTML strings in JSON files are **prohibited**.

```jsonc
// CORRECT
{
  "heroTagline": "Learn from <highlight>world-class</highlight> instructors"
}
```

```typescript
// Correct usage
t.rich('heroTagline', {
  highlight: (chunks) => <span className="text-primary">{chunks}</span>,
});
```

```jsonc
// PROHIBITED — never put raw HTML in message JSON
{
  "heroTagline": "Learn from <span class=\"text-primary\">world-class</span> instructors"
}
```

This rule prevents XSS via translation strings (SR-004 in spec).

---

## String Length Guidelines

Arabic text is typically 20–40% longer than English equivalents. Designers and developers must account for this in layout:

| UI Surface | English Max (chars) | Arabic Max (chars) | Notes |
|------------|--------------------|--------------------|-------|
| Button label | 20 | 28 | Verify on mobile viewport |
| Navigation item | 15 | 22 | |
| Form field label | 30 | 45 | Allow label wrapping |
| Page heading (h1) | 60 | 90 | Use `line-clamp` only when necessary |
| Meta description | 160 | 200 | SEO; truncation acceptable |
| Email subject | 60 | 80 | Email clients truncate at ~80 chars |
| Toast notification | 80 | 120 | No truncation; allow wrapping |

---

## ICU Syntax Validation

Before release, all message files are validated for ICU syntax correctness:

```bash
pnpm i18n:validate-icu
```

This script:
1. Parses every JSON message file.
2. Runs each string value through an ICU message parser.
3. Fails with exit code 1 if any string contains malformed ICU syntax.
4. Reports the namespace, key, and locale of each invalid string.

---

## Coverage Check Rules

Run `pnpm i18n:check` to validate Arabic coverage. This is a required CI gate.

| Check | Required Result | Action if Fail |
|-------|-----------------|---------------|
| English source file exists for every namespace | Pass | Block PR |
| Arabic file exists for every in-scope namespace | Pass | Block Arabic launch |
| Arabic contains all required English keys | Pass | Block Arabic launch |
| No Arabic stub/placeholder values (`__NEEDS_TRANSLATION__`) | Pass | Block Arabic launch |
| Interpolation variable names match English | Pass | Block Arabic launch |
| ICU syntax valid in all locale files | Pass | Block PR |
| No raw internal identifiers or stack traces in values | Pass | Block PR |

---

## Fallback Rules

**Development**: Missing Arabic keys throw a visible error in the console. This forces the developer to add the translation before continuing. Do not suppress in development.

**Production**: Missing Arabic keys silently fall back to the English value. The system logs a `LocalizationGap` record with `type: 'missing_translation'` and `severity: 'user_visible'`. The fallback value is the English string — never a raw key, placeholder token, stack trace, or internal ID.

**Error suppression in production**: Configure `next-intl` with:
```typescript
// src/lib/i18n/messages.ts
onError(error) {
  if (process.env.NODE_ENV === 'production') {
    // Log to Sentry/observability without leaking OTP or session data
    logger.warn('i18n fallback', {
      key: error.originalMessage,
      locale: error.locale,
      // NEVER log OTP, reset URLs, user emails, or session tokens
    });
  } else {
    throw error; // Throw in development to force fix
  }
},
getMessageFallback({ namespace, key }) {
  // Return English fallback — never return raw key
  return `[${namespace}.${key}]`; // dev only; prod always has EN fallback
},
```

---

## Approval Workflow (Arabic)

Arabic translations go through the following approval steps before the `ar/*.json` files are merged to `main`:

1. **Extraction**: English keys are complete and frozen for the translation batch.
2. **Translation**: Professional translator delivers `ar/*.json` files.
3. **Technical review**: An engineer verifies ICU syntax, interpolation variable names, and key structure match English.
4. **Content review**: A native Arabic speaker reviews copy for accuracy, tone, and cultural appropriateness.
5. **Approval sign-off**: Content/product owner records approval in `data-model.md` `MessageCatalog.approvedBy` and `approvedAt`.
6. **Coverage gate**: `pnpm i18n:check` passes.
7. **Merge**: Arabic files are merged to `main` and Arabic broad exposure is unblocked.

**No machine-translated copy may be approved under this workflow without explicit written exception from the product owner, documented in the PR.**

---

## Key Freeze Protocol

When translation work begins for a batch:
1. The English keys for that batch are **frozen** — no new keys may be added to English files until the translation batch completes.
2. If a new key is urgently needed during translation, it is added to English with an English value, and the Arabic stub file receives `"__NEEDS_TRANSLATION__"` to trigger a coverage failure that forces resolution.
3. After the translation batch merges, the freeze lifts.

---

## Non-Goals

- Translator-facing content management UI (V3+).
- Machine-generated Arabic copy as a primary source.
- Translated course record fields, lesson content, or localized course slugs (V3+).
- Per-component translation files (increases duplication; rejected).
- Database-managed message storage for V2 (operational overhead not justified; JSON files are sufficient).
