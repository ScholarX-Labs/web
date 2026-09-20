## 2024-05-18 - Restrict Zod URL Schemas to Prevent Stored XSS
**Vulnerability:** Zod's `.url()` validation inherently accepts any valid URI scheme, including `javascript:`, which can lead to stored Cross-Site Scripting (XSS) if these URLs are later rendered as `href` attributes in the frontend.
**Learning:** In Next.js/Zod applications, URL validations for user inputs (like profile social links or admin course/lesson URLs) must explicitly restrict the protocol to HTTP/HTTPS to prevent `javascript:` URI injection.
**Prevention:** Always refine user-facing `.url()` schemas to enforce `http://` or `https://` protocols using a regex like `.refine(val => /^https?:\/\//i.test(val), 'URL must be http or https')` or by using a custom secure URL validation function.
