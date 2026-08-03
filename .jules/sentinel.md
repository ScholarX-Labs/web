
## 2024-05-18 - [Timing Attack in x-internal-key]
**Vulnerability:** The API route `src/app/api/admin/storage-check/route.ts` compared the `x-internal-key` against `process.env.INTERNAL_API_KEY` using strict equality (`===`), creating a timing attack vulnerability.
**Learning:** Checking lengths of buffers instead of strings is crucial before executing `crypto.timingSafeEqual` in Javascript to prevent `RangeError` with multi-byte characters. Also, empty string fallbacks can introduce auth bypasses.
**Prevention:** Always use `node:crypto.timingSafeEqual()` with length-checked Buffers when comparing sensitive secrets or API keys. Ensure both the provided key and expected key are truthy to prevent bypass via empty strings.
