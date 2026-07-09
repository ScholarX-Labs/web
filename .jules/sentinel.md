## 2024-05-18 - [Stored XSS via Zod URL Validation]
**Vulnerability:** Zod's `z.string().url()` permits `javascript:` URIs by default, which can lead to stored XSS if the URL is later rendered in the application (e.g., in a link `href` or image `src`).
**Learning:** Default URL validation libraries often only check for URL syntax but do not restrict the scheme to safe protocols, leaving an easy attack vector for injecting malicious scripts.
**Prevention:** Always refine URL schemas to enforce safe schemes (e.g., `http://` or `https://`) using `.refine(val => /^https?:\/\//i.test(val))`.
