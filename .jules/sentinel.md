
## 2024-08-12 - Prevent Timing Attacks in API Key Comparison
**Vulnerability:** Strict string equality (`===`) was used to compare the provided `x-internal-key` against `INTERNAL_API_KEY`, exposing the application to timing attacks that could reveal the API key character by character.
**Learning:** String comparisons terminate early on the first mismatch. Attackers can measure the response time to guess the secret token. Fallbacks to empty strings or missing environment variables can lead to unintended authentication bypasses if poorly handled.
**Prevention:** Use `crypto.timingSafeEqual` for all secret comparisons. Always convert inputs to Buffers first, verify that both the provided and expected keys exist, and check that their byte lengths match before calling `timingSafeEqual` to avoid `RangeError` on multi-byte strings.
