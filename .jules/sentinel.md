## 2024-08-14 - Timing Attack Vulnerability in API Key Validation
**Vulnerability:** String comparison using standard equality (`===`) when comparing sensitive secrets, such as API keys in incoming requests vs. expected keys. This allows for timing attacks, exposing the key incrementally by measuring comparison time.
**Learning:** Comparing secrets string-by-string natively exits as soon as a mismatch is found, meaning longer match durations imply a longer shared prefix. This was used to validate `x-internal-key` against `INTERNAL_API_KEY`.
**Prevention:** Always use `crypto.timingSafeEqual` with `Buffer.from(secret)` after ensuring both Buffers have exactly the same length. Avoid empty string fallback vulnerabilities (`"" === ""`) by checking that the key was genuinely provided.
