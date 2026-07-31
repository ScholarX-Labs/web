## 2025-02-14 - Fix Stored XSS in Zod URL Schemas
**Vulnerability:** Default `z.string().url()` schemas in profile and admin validation allowed `javascript:` URIs.
**Learning:** Zod's native URL validation only checks for general URL structure but does not enforce specific protocols. This means it accepts potentially malicious schemes like `javascript:`, which can lead to stored XSS if these user-supplied URLs are rendered as `href` attributes in the frontend without further sanitization.
**Prevention:** Always refine `z.string().url()` schemas using a regex or custom validation (e.g., `.refine(val => /^https?:\/\//i.test(val))`) to strictly enforce expected and safe protocols (`http` and `https`) when validating user-provided links.
