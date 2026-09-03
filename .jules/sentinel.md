
## 2024-05-31 - [Stored XSS via Zod URL Validation Bypass]
**Vulnerability:** Zod's `.url()` schema permits `javascript:` URIs by default, which can lead to stored XSS if these user-provided URLs are rendered in `href` attributes (like in profiles or admin dashboards) without further protocol checking.
**Learning:** Standard library validators like Zod's `.url()` might not be secure enough out-of-the-box against web-specific attack vectors like `javascript:` protocol XSS, focusing only on structural URL validity.
**Prevention:** Always append a `.refine((val) => /^https?:\/\//i.test(val), "Must be HTTP/HTTPS")` to Zod URL schemas (or equivalent protocol checks) when accepting URLs that will be rendered back to users to ensure only safe protocols are allowed.
