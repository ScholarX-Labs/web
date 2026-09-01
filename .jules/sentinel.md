
## 2024-05-24 - [Fix Timing Attack in Internal API Authorization]
**Vulnerability:** Timing attack vulnerability in internal API authorization due to strict string equality (`===`) comparison of the expected API key with the user-provided one. This allows attackers to guess the API key character by character by measuring the response time.
**Learning:** Comparing sensitive strings like API keys or secrets with strict equality (`===`) is insecure in Next.js server-side logic and edge environments, as it introduces a timing attack vector.
**Prevention:** Always use `crypto.timingSafeEqual` for sensitive string comparisons. Before comparison, ensure both strings are converted to Buffers and verify their byte lengths are equal to prevent length-based early exits or `RangeError` with multi-byte characters. Use a secure fallback if values are missing.
