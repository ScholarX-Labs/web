## 2024-05-24 - [CRITICAL] Prevent timing attacks on internal API key checks

**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being validated using a simple equality check (`===`).
**Learning:** Comparing secrets with `===` returns as soon as a mismatch is found, allowing timing attacks to guess the secret one character at a time by observing the response time.
**Prevention:** When comparing sensitive strings like API keys or secrets, always convert the inputs to Buffers, verify their byte lengths match, and use `crypto.timingSafeEqual` instead of strict equality to prevent timing attacks.
