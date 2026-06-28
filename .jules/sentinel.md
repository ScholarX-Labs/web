## 2024-05-18 - [Zod Stored XSS via .url()]
**Vulnerability:** Zod's default `.url()` schema permits `javascript:` URIs, which can lead to Stored Cross-Site Scripting (XSS) if these URLs are stored and rendered dynamically in hrefs or src attributes.
**Learning:** Never assume that a generic URL validation restricts protocols. The `.url()` method strictly checks for valid URI parsing, not safe web protocols.
**Prevention:** To prevent this, URL schemas must be explicitly refined to enforce `http://` or `https://` protocols using `.refine(val => !val || /^https?:\/\//i.test(val), "URL must start with http:// or https://")` or similar strict parsing logic.
