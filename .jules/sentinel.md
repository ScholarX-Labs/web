## 2023-10-27 - Prevent Stored XSS in Social Links
**Vulnerability:** The Zod `url()` validation used for social links allowed `javascript:` and `data:` protocols, which could lead to stored XSS if a user entered a malicious payload like `javascript:alert(1)` for their GitHub link.
**Learning:** Zod's built-in `.url()` validation only checks if a string is a valid URI, it does not restrict the scheme to safe protocols. This is a common security pitfall.
**Prevention:** Always restrict URL inputs to safe protocols (e.g. `http://` or `https://`) using `.refine()` in Zod. Additionally, defend in depth by enforcing safe protocols when rendering external links via `href`. Added a `isValidUrl` utility function for this purpose.
