
## 2024-05-24 - Timing Attack Vulnerability in Internal API Key Comparison
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being compared using strict equality (`===`).
**Learning:** Strict equality operators perform string comparisons that return immediately upon finding the first non-matching character. This exposes the application to timing attacks where an attacker can theoretically deduce the secret key character by character based on the time it takes the server to respond to requests with different key guesses.
**Prevention:** Always use `crypto.timingSafeEqual` when comparing sensitive strings like API keys, passwords, or authentication tokens. Convert strings to `Buffer` objects and ensure their lengths are equal before calling `timingSafeEqual`. Avoid empty string fallbacks for expected keys.
