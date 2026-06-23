## 2024-06-23 - [Prevent Timing Attack on Internal API Key]
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was checked using a strict equality (`===`) comparison. This allows an attacker to perform a timing attack because the strict equality operator checks character by character and returns early when it finds a mismatch, leaking information about the expected key length and characters.
**Learning:** When comparing sensitive strings like API keys, always use constant-time comparisons (`crypto.timingSafeEqual`) instead of standard equality operators.
**Prevention:** Convert string inputs to Buffers, verify their lengths match before comparison to prevent `RangeError`, and then use `crypto.timingSafeEqual`.
