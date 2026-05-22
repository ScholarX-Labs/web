## 2026-05-22 - [Prevent Stored XSS via Zod URL Validation]
**Vulnerability:** Zod's default `.url()` validator permits `javascript:` URIs, potentially leading to stored XSS vulnerabilities when malicious URLs are rendered in `<a>` or `<img>` tags.
**Learning:** Found multiple instances where `.url()` was used without scheme validation in configuration and input validation schemas (e.g., `admin-validation.schemas.ts`, `profile.actions.ts`).
**Prevention:** All Zod URL schemas must include a refinement to enforce `http://` or `https://` protocols: `.refine((s) => s.startsWith("http://") || s.startsWith("https://"), { message: "URL must be http or https" })`. This ensures URLs are safe for rendering.
