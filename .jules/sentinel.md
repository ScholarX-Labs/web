
## 2024-05-18 - [HIGH] Fix Stored XSS vulnerability via Zod's URL validation
**Vulnerability:** Zod's default `.url()` schema permits arbitrary URI schemes, including `javascript:` URIs. When these validated values (like `imageUrl` or `videoUrl`) are rendered directly into HTML attributes (e.g., `<img src="...">` or `<a href="...">`), it allows for Stored Cross-Site Scripting (XSS) attacks.
**Learning:** Input validation that simply checks for "url format" is insufficient for security. We must explicitly allowlist safe protocols to prevent dangerous URI schemes from being processed and stored.
**Prevention:** Always refine Zod URL schemas to enforce safe protocols using regex: `z.string().url().refine(val => /^https?:\/\//i.test(val), "Must use http/https")`.
