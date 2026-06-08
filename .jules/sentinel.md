## 2024-06-08 - Use `timingSafeEqual` for Secret Comparisons
**Vulnerability:** Comparing sensitive values like API keys (e.g. `x-internal-key` vs `process.env.INTERNAL_API_KEY`) using standard equality (`===`) exposes the comparison to timing attacks, as string comparisons terminate early when characters do not match.
**Learning:** Comparing keys character-by-character allows attackers to deduce the key based on response times, potentially bypassing internal authentication.
**Prevention:** Always use `crypto.timingSafeEqual` to compare secrets in constant time. Make sure both provided and expected secrets exist, convert them to Buffers, and verify their byte lengths (`buf.length`) match before comparing.
