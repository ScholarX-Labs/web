## 2025-02-14 - [Timing Attack] Constant-Time Key Comparison
**Vulnerability:** The internal API key (`INTERNAL_API_KEY`) was being compared against the `x-internal-key` header using strict string equality (`===`).
**Learning:** Strict string equality checks fail fast, meaning they return `false` on the first mismatched character. This allows attackers to perform a timing attack to brute-force the secret key character by character by measuring response times.
**Prevention:** Always use constant-time comparison methods like `crypto.timingSafeEqual` when checking sensitive secrets, tokens, or API keys. Ensure that the strings are converted to `Buffer`s and their byte lengths are compared first to prevent `RangeError` exceptions.
