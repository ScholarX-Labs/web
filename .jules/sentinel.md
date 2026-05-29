## 2025-05-18 - Timing Attack Vulnerability
**Vulnerability:** A timing attack vulnerability was present in the API where the `x-internal-key` header was compared to `process.env.INTERNAL_API_KEY` using strict equality (`===`).
**Learning:** Using strict equality to compare sensitive strings, such as API keys, can allow attackers to perform timing attacks. They can measure the time it takes for the comparison to fail and use that information to guess the key.
**Prevention:** Always use `crypto.timingSafeEqual` for comparing sensitive strings. Ensure that the strings are converted to Buffers first and that their byte lengths match (`buf1.length === buf2.length`) before calling `timingSafeEqual` to avoid a `RangeError`.
