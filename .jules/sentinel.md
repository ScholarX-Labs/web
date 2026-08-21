
## 2026-08-21 - Stored XSS via Zod's `url()` Validation
**Vulnerability:** Zod's default `.url()` string validation schema permits `javascript:` and `data:` URIs, leading to a Stored XSS vulnerability when these URLs are rendered as `href` attributes in anchor tags or similar DOM contexts.
**Learning:** Security validations (like URL schemes) are not always implicitly handled by standard library format checkers. The `.url()` validator only checks if the string can be parsed as a URL, regardless of the protocol.
**Prevention:** Always refine user-provided URL schemas with a regex or URL parser check (e.g., `.refine(val => /^https?:\/\//i.test(val))`) to strictly enforce only HTTP and HTTPS protocols.
