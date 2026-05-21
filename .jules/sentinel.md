## 2024-05-21 - [Zod URL Validation Stored XSS Risk]
**Vulnerability:** Zod's default `.url()` validation allows `javascript:` URIs. When user input containing `javascript:` URIs is stored and later rendered in `href` or `src` attributes, it creates a Stored XSS vulnerability.
**Learning:** This existed because standard URL definitions technically include data and javascript protocols, but for web application fields like "social links" or "image sources", only HTTP/HTTPS are safe.
**Prevention:** Always refine Zod URL schemas for user-supplied data to explicitly check for HTTP/HTTPS protocols using `.refine(s => s.startsWith('http://') || s.startsWith('https://'))`.
