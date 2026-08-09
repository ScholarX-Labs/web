## 2024-05-24 - Timing Attack on Internal API Key
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being checked using strict equality (`===`), making it vulnerable to a timing attack where an attacker could theoretically guess the key by measuring the response time.
**Learning:** Comparing secrets directly using `===` in Node.js/Next.js exposes the comparison time (which stops as soon as a mismatch is found), leading to timing attacks.
**Prevention:** Always use `crypto.timingSafeEqual` when comparing sensitive strings like API keys or secrets. Note that `timingSafeEqual` requires the buffers to be of equal length, so length bounds checking must be done prior to calling it to avoid `RangeError`.
