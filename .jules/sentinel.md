## 2024-05-24 - [Stored XSS via javascript: URIs in Zod]
**Vulnerability:** Zod's `.url()` schema permits `javascript:` URIs by default, allowing Stored XSS if user-supplied URLs (like social links or media URLs) are rendered directly into `href` or `src` attributes without proper sanitization.
**Learning:** Default validation libraries often conform to relaxed RFC specifications rather than strict security requirements for web contexts. A valid URL is not necessarily a safe URL.
**Prevention:** Always combine `z.string().url()` with a `.refine()` block (or use a regex) to explicitly allowlist safe protocols like `http://` and `https://` when the URL will be used in a web context.
