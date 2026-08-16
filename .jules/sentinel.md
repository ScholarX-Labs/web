## 2024-05-24 - Stored XSS via Zod URL Validation
**Vulnerability:** The Zod `.url()` schema permits `javascript:` URIs by default, allowing Stored Cross-Site Scripting (XSS) when URLs are rendered in the application.
**Learning:** Default validation schemas may not always enforce strict security policies like specific protocols (http/https), necessitating manual refinement.
**Prevention:** Always refine Zod URL schemas (e.g., using a regex like `/^https?:\/\//i`) to enforce `http://` or `https://` protocols, preventing the execution of malicious scripts.
