## 2024-05-18 - [Prevent XSS from User-Submitted URLs]
**Vulnerability:** Zod's default `z.string().url()` validation schema permits dangerous protocols like `javascript:`. If rendered as an `href` or `src` attribute, this could lead to Cross-Site Scripting (XSS).
**Learning:** External links provided by users (such as social profile links and course URLs) did not restrict the URI scheme, creating a risk of stored XSS via custom URIs.
**Prevention:** Implement a custom `isValidUrl` validation helper to parse URLs using the built-in `URL` class and explicitly enforce `http:` or `https:` protocols. Append `.refine(isValidUrl)` to all Zod schemas accepting external URLs.
