## 2024-05-28 - Zod `.url()` Allows `javascript:` URIs
**Vulnerability:** Zod's built-in `.url()` schema permits `javascript:` URIs, which can lead to stored XSS vulnerabilities when used for fields like social links, profile images, or video URLs that are later rendered in the DOM.
**Learning:** Default URL validation libraries often strictly follow RFCs for URIs without applying context-specific security constraints like restricting schemes to HTTP/HTTPS.
**Prevention:** Always refine URL schemas using `.refine(val => /^https?:\/\//i.test(val))` to explicitly enforce secure protocols (`http://` or `https://`) and prevent script execution vectors.
