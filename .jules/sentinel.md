## 2024-05-30 - [Timing Attack Prevention on Internal API Key Comparison]
**Vulnerability:** Internal API key check (`x-internal-key`) used strict equality (`===`), making it theoretically susceptible to timing attacks.
**Learning:** Even internal API checks should use constant-time comparisons when comparing secrets to prevent timing side channels.
**Prevention:** Always use `crypto.timingSafeEqual` after converting strings to Buffers and verifying equal byte lengths when comparing sensitive values like API keys or signatures.
