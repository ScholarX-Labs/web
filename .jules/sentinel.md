## 2024-05-31 - [Timing Attack Risk on Internal API Key Validation]
**Vulnerability:** The internal API endpoint `/api/admin/storage-check` compared the `x-internal-key` header with `process.env.INTERNAL_API_KEY` using strict equality (`===`).
**Learning:** Strict equality checks strings character-by-character and returns `false` on the first mismatch. This can allow attackers to perform timing attacks by measuring the time the comparison takes to deduce the correct key byte-by-byte.
**Prevention:** Always use `crypto.timingSafeEqual` when comparing sensitive tokens, secrets, or API keys. Ensure that the strings are converted to `Buffer`s first, and verify that their buffer lengths (in bytes) match to avoid `RangeError` on mismatched length inputs.
