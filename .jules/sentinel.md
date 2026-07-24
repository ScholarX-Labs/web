## 2025-02-14 - Zod URL Schema Allows javascript: URIs
**Vulnerability:** XSS vulnerability through user-provided URLs when validated using Zod's default `.url()` schema, which allows `javascript:` URIs by default.
**Learning:** Zod's `.url()` schema is too permissive for web contexts where URLs might be rendered in anchors or src attributes. It validates the URI format but does not restrict the protocol.
**Prevention:** Always refine Zod URL schemas to explicitly enforce `http://` or `https://` protocols (e.g., using `.refine(val => /^https?:\/\//i.test(val))`) to prevent stored XSS vulnerabilities.
