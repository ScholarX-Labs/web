## 2024-11-02 - [Fix timing attack in admin API key comparison]
**Vulnerability:** The internal API key check in `src/app/api/admin/storage-check/route.ts` used string equality (`===`), making it vulnerable to timing attacks when comparing `x-internal-key` against `process.env.INTERNAL_API_KEY`.
**Learning:** String equality operators exit early when they find a mismatch, which can be measured to guess the key. Also, empty/undefined fallback strings shouldn't be used to prevent auth bypasses if env vars are unset.
**Prevention:** Use `crypto.timingSafeEqual` with proper buffer length checks, and explicitly verify both keys are present.
