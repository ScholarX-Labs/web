
## 2025-02-13 - Timing Attack Vulnerability in API Key Check
**Vulnerability:** Comparing sensitive tokens like internal API keys using strict string equality (`===`) is vulnerable to timing attacks, as attackers could potentially guess the key character by character based on response times.
**Learning:** This repo authenticates internal requests using a custom `x-internal-key` header and compares it directly to `process.env.INTERNAL_API_KEY`. This was found in `/api/admin/storage-check`.
**Prevention:** Always use `crypto.timingSafeEqual` after converting string tokens to Buffers, ensuring they are of the same byte length (`buffer.length`) before comparison.
