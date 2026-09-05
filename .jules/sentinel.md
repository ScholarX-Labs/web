## 2024-05-18 - [Preventing Stored XSS via Zod URL Schemas]
**Vulnerability:** Zod's `.url()` schema permits `javascript:` URIs by default, which can lead to stored XSS if these URLs are rendered as links or image sources in the frontend without further sanitization.
**Learning:** In this project, `z.string().url()` was used in user profile fields and admin course fields, posing a stored XSS risk.
**Prevention:** Always refine Zod `.url()` schemas for user-facing inputs to explicitly enforce `http://` or `https://` protocols (e.g., using `.refine(val => /^https?:\/\//i.test(val))`). Note: This validation is NOT necessary for trusted environment variables (like API endpoints) where it would constitute security theater.
