## 2024-05-31 - [Timing Attack Risk on Internal API Key]
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was compared using strict equality `===`, making it susceptible to timing attacks. An attacker could potentially infer the API key by measuring response times.
**Learning:** Strict equality `===` should not be used for comparing sensitive tokens or keys like `INTERNAL_API_KEY`, because string comparison terminates early on mismatch.
**Prevention:** Always use `crypto.timingSafeEqual` after converting the strings into Buffers and comparing their lengths for comparing sensitive keys to ensure constant-time comparison.
