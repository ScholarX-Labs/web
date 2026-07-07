## 2026-07-07 - [Timing Attack Vulnerability in API Key Check]
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being checked against the `x-internal-key` header using strict equality (`===`).
**Learning:** Comparing secrets with `===` is vulnerable to timing attacks. Furthermore, if an expected secret (like an API key from an environment variable) evaluates to an empty or falsy value, fallback strings might cause a comparison bypass.
**Prevention:** Always use `crypto.timingSafeEqual` to compare sensitive values like API keys or signatures in constant time. Make sure both provided and expected values are converted to Buffers, and that you verify they are not empty and have matching lengths prior to calling `timingSafeEqual`.
