## 2025-02-20 - Zod URL Schema XSS Vulnerability
**Vulnerability:** Default `.url()` validation in Zod permits `javascript:` and `data:` URIs, which can lead to stored XSS if these values are rendered in `href` or `src` attributes without further sanitization.
**Learning:** We must not rely on Zod's `.url()` alone for user-facing URLs (like social links or media URLs) as it does not enforce safe protocols by default.
**Prevention:** Always use `.refine(val => /^https?:\/\//i.test(val), "Must be an HTTP/HTTPS URL")` or similar strict protocol validation when validating URLs with Zod.
