## 2023-10-27 - [Fix timing attack vulnerability in internal API key validation]
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being validated using a strict equality check (`===`).
**Learning:** This exposes the endpoint to a timing attack, as the time taken to evaluate the comparison can leak information about the correctness of the provided key character by character.
**Prevention:** Always use `crypto.timingSafeEqual` with Buffers of equal length to validate secrets in constant time. Avoid using empty string fallbacks (`|| ""`) which can bypass authentication entirely if environment variables are missing.
