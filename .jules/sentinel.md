## 2026-08-25 - Fix timing attack in internal API key validation
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being compared using strict equality (`===`), making it susceptible to timing attacks.
**Learning:** Using strict equality allows attackers to incrementally guess the secret key by measuring the time it takes for the comparison to fail.
**Prevention:** Always use `crypto.timingSafeEqual` for comparing sensitive secrets (like API keys, tokens, or HMACs), ensuring they are converted to buffers and their lengths are compared first to prevent `RangeError`.
