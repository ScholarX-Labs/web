## 2025-02-12 - Prevent Stored XSS from Zod `z.string().url()` `javascript:` URIs
**Vulnerability:** Zod's `z.string().url()` validation allows `javascript:` URIs by default, which can lead to Stored XSS when these URLs are reflected in link `href` attributes (like social links).
**Learning:** Default URL validation in many libraries only checks if a string is a valid URI format, not if the scheme is safe for a web context.
**Prevention:** Always refine URL schemas to explicitly enforce `http://` or `https://` schemes, e.g. `z.string().url().refine((val) => /^https?:\/\//i.test(val), "URL must use http:// or https://")`.
