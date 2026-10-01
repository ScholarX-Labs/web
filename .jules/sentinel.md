## 2023-10-01 - Fix Timing Attack in Internal Auth Checking
**Vulnerability:** The internal API key check in `src/app/api/admin/storage-check/route.ts` used strict equality (`===`) to compare the provided key with the stored key. This is susceptible to timing attacks, as strict equality evaluates character by character and exits early on a mismatch, allowing attackers to guess the key sequentially.
**Learning:** Even simple string comparisons for sensitive data can introduce timing side channels.
**Prevention:** Always use constant-time equality checks (e.g., `crypto.timingSafeEqual`) when comparing sensitive strings like API keys, secrets, or tokens. Ensure to check the length of Buffers before comparison to avoid exceptions.
