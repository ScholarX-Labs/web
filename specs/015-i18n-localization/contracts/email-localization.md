# Contract: Email Localization

**Version**: 1.0.0
**Owner**: Engineering
**Last Updated**: 2026-06-02

---

## Purpose

Define the behavior, structure, security requirements, and testing expectations for localized account-related transactional emails. This contract covers the four auth flows that send email: verification OTP, sign-in OTP, password reset, and account change.

---

## Template IDs

| Template ID | Trigger | Existing Location |
|-------------|---------|-----------------|
| `email_verification_otp` | User registers or requests email verification | `src/lib/auth.ts` lines 94–105 |
| `signin_otp` | Passwordless sign-in | `src/lib/auth.ts` lines 107–115 |
| `password_reset` | User requests password reset | `src/lib/auth.ts` lines 117–128 |
| `email_change` | User changes their email address | `src/lib/auth.ts` lines 130–146 |

---

## Required Template Output

| Field | Required | Description |
|-------|----------|-------------|
| `locale` | Yes | `'en'` or `'ar'` — the resolved locale |
| `direction` | Yes | `'ltr'` or `'rtl'` — derived from locale |
| `subject` | Yes | Localized email subject line |
| `text` | Yes | Plain-text body — actionable without HTML or images |
| `html` | Optional | HTML body — must declare `lang` and `dir`; all variables escaped |
| `category` | Yes | Existing email category (no change) |

```typescript
export interface EmailOutput {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  subject: string;
  text: string;
  html?: string;
}
```

---

## Locale Resolution (Ordered)

```
1. auth.user.locale from database (authenticated user preference)
2. Active auth journey locale (locale from the URL that triggered the flow)
3. 'en' — English fallback (always available)
```

Implementation: `src/lib/email/send.ts` → `resolveEmailLocale(userId?, journeyLocale?)`.

---

## Variable Rules

| Variable | Templates Using It | Rules |
|----------|--------------------|-------|
| `otp` | `email_verification_otp`, `signin_otp`, `email_change` | MUST NOT be logged outside delivery. MUST NOT appear in error messages or gap reports. HTML output must escape it (though OTP codes are numeric and injection-safe, escaping is a general rule). |
| `expiryMinutes` | All OTP templates | Numeric. Present as locale-appropriate number (use `Intl.NumberFormat`). |
| `resetUrl` | `password_reset` | MUST be HTML-escaped in HTML output. Verify it is an internal URL before rendering (does not contain external redirect). |
| `appName` | All | Static value `'ScholarX'`. Not user-supplied. |

---

## Security Requirements

### HTML Injection Prevention (SR-003 in spec)

All runtime variables MUST be passed through HTML escaping before interpolation into the `html` field:

```typescript
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

Even though `otp` is numeric and `resetUrl` is generated internally, the escaping rule applies universally. Defense in depth.

### Reset URL Validation

The `resetUrl` variable must be validated as an internal URL before rendering:

```typescript
function isInternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedHost = new URL(process.env.BETTER_AUTH_URL!).host;
    return parsed.host === allowedHost;
  } catch {
    return false;
  }
}
```

If the URL is not internal, do not render the `html` field. Render `text` only with the URL as plain text.

### Logging Rules (FR-023 in spec)

OTP values and reset URLs MUST NOT appear in:
- Server logs
- Error traces
- Sentry reports
- Localization gap records
- Any monitoring payload

Template functions must not log the `otp` or `resetUrl` variables. If an error occurs during template rendering, log the `templateId` and `locale` only.

---

## Email Encoding

- All emails MUST be sent with `charset=UTF-8`.
- The `Subject` header for Arabic emails must be encoded using RFC 2047 `B` encoding if the email transport does not handle UTF-8 subjects natively:
  ```
  Subject: =?UTF-8?B?<base64-encoded-arabic-subject>?=
  ```
  Nodemailer handles this automatically when `charset: 'utf8'` is set.
- Arabic HTML emails must declare `<meta charset="UTF-8">` in the `<head>`.

---

## HTML Template Structure (Arabic)

Arabic HTML email bodies MUST:
1. Set `<html lang="ar-EG" dir="rtl">`.
2. Use inline styles for `direction: rtl` and `text-align: right` on the `<body>` — not all email clients respect CSS classes.
3. Use Arabic-compatible font stack: `'Noto Sans Arabic', Arial, sans-serif`.
4. Set `line-height: 1.8` for Arabic body text.
5. Render the OTP code in a visually prominent block with `direction: ltr` and `text-align: center` so digits display left-to-right regardless of surrounding RTL context.

```html
<!-- OTP code block for Arabic emails -->
<div style="direction:ltr;text-align:center;font-size:32px;
            letter-spacing:8px;font-family:monospace;
            background:#f5f5f5;padding:16px;border-radius:8px;">
  123456
</div>
```

---

## English Message Examples (Source for Arabic Translation)

```jsonc
// src/messages/en/email.json
{
  "verification": {
    "subject": "Your ScholarX email verification code",
    "body": "Your verification code is {otp}. It expires in {expiryMinutes} minutes.",
    "cta": null
  },
  "signinOtp": {
    "subject": "Your ScholarX sign-in code",
    "body": "Your sign-in code is {otp}. It expires in {expiryMinutes} minutes.",
    "cta": null
  },
  "passwordReset": {
    "subject": "Reset your ScholarX password",
    "body": "Click the link below to reset your password. This link expires in {expiryMinutes} minutes.",
    "cta": "Reset Password"
  },
  "emailChange": {
    "subject": "Your ScholarX email change code",
    "body": "Your email change verification code is {otp}. It expires in {expiryMinutes} minutes.",
    "cta": null
  }
}
```

---

## Validation Requirements

| Check | Required |
|-------|----------|
| English output exists for each of the 4 template IDs | Yes |
| Arabic output exists for each of the 4 template IDs | Yes (before Arabic enablement) |
| Arabic output declares `direction: 'rtl'` | Yes |
| Arabic `subject` is non-empty and Arabic text | Yes |
| Arabic `text` is non-empty, actionable without HTML | Yes |
| `html` (when present) declares `lang` and `dir` | Yes |
| `html` HTML-escapes all interpolated variables | Yes |
| OTP not logged during template execution | Yes |
| `resetUrl` validated as internal URL before rendering | Yes |
| UTF-8 encoding set on transport | Yes |
| Template generation does not break existing delivery service contract | Yes |

---

## Testing Requirements

### Unit Tests

For each template (`email_verification_otp`, `signin_otp`, `password_reset`, `email_change`):

1. English output: subject is English, `direction` is `'ltr'`, `text` is non-empty.
2. Arabic output: subject is Arabic, `direction` is `'rtl'`, `text` is non-empty, `html` includes `dir="rtl"`.
3. OTP interpolation: `{otp}` placeholder is replaced with the provided value.
4. HTML escaping: `<script>alert(1)</script>` in a variable is escaped in HTML output.
5. Fallback: `resolveEmailLocale(undefined, undefined)` returns `'en'`.
6. Priority: `resolveEmailLocale('user-id-with-ar-pref', undefined)` returns `'ar'`.
7. Reset URL validation: an external URL in `resetUrl` does not appear in `html` output.

### Integration Tests

1. Trigger a sign-up with Arabic journey locale → verify the verification email arrives with Arabic subject.
2. Trigger a password reset for a user with `locale: 'ar'` → Arabic email generated.
3. Trigger a password reset for a user with no locale preference → English email generated.

---

## Delivery Service Contract (Unchanged)

This contract modifies only the message generation layer. The downstream delivery service (Nodemailer + existing email domain services) is unchanged. The template functions produce an `EmailOutput` object that is passed to the existing `sendEmail()` function with its existing transport configuration. No changes to SMTP configuration, provider events API, or email logging are introduced by this feature.
