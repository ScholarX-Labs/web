## 2025-05-17 - Prevent Stored XSS via Malicious URIs
**Vulnerability:** External URLs supplied by users (e.g. `applicationLink`, `officialWebsite`, social links) were being rendered directly into `href` attributes without protocol sanitization, which allows for Cross-Site Scripting (XSS) via `javascript:alert(1)` payloads.
**Learning:** Even if a URL field requires a "URL" format on input, if the validation (like Zod `.url()`) doesn't restrict the protocol, malicious `javascript:` URIs can be stored and later executed by users clicking the link.
**Prevention:** Always validate that user-provided URLs use safe protocols (`http:` or `https:`) before rendering them in `href` attributes. A utility function `isValidUrl` using the native `URL` API is an effective way to enforce this.
