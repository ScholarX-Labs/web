## 2025-02-14 - Fix Timing Attack Vulnerability in API Key Validation
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being validated using strict string equality (`===`). This allows for a timing attack because V8 string comparison exits early when a mismatch occurs, potentially leaking the characters of the API key if an attacker carefully measures response times.
**Learning:** Security-sensitive string comparisons like API keys, secrets, or tokens should never be compared using strict string equality.
**Prevention:** Always use `crypto.timingSafeEqual` after converting the strings to `Buffer` objects and asserting their byte lengths are equal to prevent buffer length mismatch exceptions.
