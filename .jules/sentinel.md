## 2024-06-06 - [Timing Attack in Secret Comparison]
**Vulnerability:** Comparing sensitive secrets like API keys (`x-internal-key`) and environment variables (`INTERNAL_API_KEY`) using strict equality (`===`).
**Learning:** Strict equality operators perform a character-by-character comparison and return `false` as soon as a mismatch is found. This allows an attacker to measure the time it takes for the comparison to fail and gradually infer the secret character by character (a timing attack).
**Prevention:** Always use `crypto.timingSafeEqual` for comparing secrets. Convert both values to `Buffer` objects, ensure their lengths match (`provided.length === expected.length`), and only then invoke `timingSafeEqual`.
