
## 2024-05-15 - Timing Attack in Internal API Key Comparison
**Vulnerability:** The internal API endpoint `/api/admin/storage-check` compared the `x-internal-key` header to `process.env.INTERNAL_API_KEY` using strict equality (`===`). This creates a timing side-channel that allows an attacker to deduce the secret key character by character by measuring the exact response time of the string comparison.
**Learning:** String comparison operators short-circuit in JavaScript, exposing sensitive string lengths and contents when validating security boundaries like internal tokens or API keys.
**Prevention:** Always use `crypto.timingSafeEqual()` to compare sensitive tokens or keys in constant time. Furthermore, always convert the compared strings to `Buffer`s and verify that their byte lengths match first, otherwise `timingSafeEqual` will throw a `RangeError`. Avoid relying on `|| ""` fallbacks to avoid logic errors and empty string bypasses.
