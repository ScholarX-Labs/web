## 2025-05-18 - [Fix Insecure String Equality for Internal API Key]
**Vulnerability:** The internal API endpoint `/api/admin/storage-check` compared the provided API key to the expected internal API key using strict string equality (`===`).
**Learning:** Using `===` for secret comparison can expose the application to timing attacks, where an attacker can determine the expected secret by measuring the time it takes for the comparison to fail.
**Prevention:** Always use `crypto.timingSafeEqual` with matched buffer lengths when comparing sensitive keys, tokens, or passwords to ensure constant-time comparison.
