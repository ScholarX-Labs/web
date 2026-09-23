## 2024-05-24 - [Fix] Timing attack on API key validation
**Vulnerability:** A standard string comparison (`===`) was used to compare the `x-internal-key` header with `process.env.INTERNAL_API_KEY`. This could allow an attacker to determine the key by measuring the time taken to process requests with incorrect keys.
**Learning:** Even internal API key checks require timing-safe comparisons to prevent sophisticated timing attacks. Additionally, the Node.js `crypto` API requires `Buffer` inputs for `timingSafeEqual` and will throw an error if the buffers have different lengths.
**Prevention:** Use `crypto.timingSafeEqual` for sensitive string comparisons, ensuring inputs are converted to Buffers and their lengths are validated before the call.
