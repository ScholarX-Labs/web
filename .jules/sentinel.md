## 2025-02-23 - [API Key Timing Attack]
**Vulnerability:** Comparing API keys via strict equality (`===`) creates a timing attack vulnerability, exposing the length and value of the expected key over time. Also, falling back to empty strings when keys are missing creates an authentication bypass.
**Learning:** Comparing sensitive secrets byte-by-byte linearly exposes the duration of the comparison based on where a difference is found.
**Prevention:** Use `crypto.timingSafeEqual` with `Buffer.from(secret)` and perform a constant-time comparison. Additionally, check that `providedBuffer.length === expectedBuffer.length` beforehand, as `timingSafeEqual` will throw a `RangeError` if lengths differ. Ensure neither provided nor expected keys fallback to empty strings.
