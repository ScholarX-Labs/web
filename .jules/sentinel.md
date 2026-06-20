
## 2025-03-09 - [Stored XSS via Zod URL Validation]
**Vulnerability:** Zod's `z.string().url()` schema permits `javascript:` URIs by default, which can lead to stored Cross-Site Scripting (XSS) if these URLs are used in `href` or `src` attributes without further sanitization.
**Learning:** Default URL validators often only check format (e.g. `scheme://...`) and do not restrict the protocol schema to safe values like `http/https`, creating an unexpected XSS attack vector when developers rely solely on them for safety.
**Prevention:** Always refine URL schemas to enforce secure protocols. Use `.refine(val => /^https?:\/\//i.test(val))` to explicitly require `http://` or `https://` schemes.
