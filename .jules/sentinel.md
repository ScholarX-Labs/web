## 2024-05-24 - Fix Timing Attack in Internal API Auth
**Vulnerability:** The internal API key validation endpoint used a strict string equality check (`===`) to verify the secret `x-internal-key` against `process.env.INTERNAL_API_KEY`. This was vulnerable to timing attacks, as strict equality short-circuits on the first mismatched byte, allowing an attacker to theoretically guess the key by measuring response times.
**Learning:** Even internal API auth needs constant-time comparisons for shared secrets.
**Prevention:** Use `crypto.timingSafeEqual` for all secret comparisons. Always check that the byte lengths of the buffers match (`buf1.length === buf2.length`) before calling the function to prevent exceptions.
