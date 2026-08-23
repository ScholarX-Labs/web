## 2024-10-25 - Prevent Timing Attacks in API Key Validation
**Vulnerability:** The internal API endpoint (`/api/admin/storage-check`) used strict string equality (`===`) to compare the `x-internal-key` header with `process.env.INTERNAL_API_KEY`.
**Learning:** String equality operators in JavaScript exit early as soon as a mismatch is found, allowing an attacker to deduce the length and contents of the correct API key by measuring the response time (timing attack).
**Prevention:** Always use `crypto.timingSafeEqual()` when comparing secrets or API keys. Both strings must be converted to `Buffer`s, and their lengths must be verified as identical before calling `timingSafeEqual()` to avoid throwing an error that could leak information.
