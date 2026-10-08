
## 2024-05-27 - [Timing Attack Mitigation for Internal API Key]
**Vulnerability:** The internal API key check (`x-internal-key` against `INTERNAL_API_KEY`) used strict string equality (`===`). This is vulnerable to timing attacks, as strict equality returns `false` as soon as it encounters the first mismatched character, allowing an attacker to deduce the key character-by-character based on response times.
**Learning:** Even simple header-based authentication checks require constant-time comparison when verifying secrets to prevent timing side-channels.
**Prevention:** Always use `crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected))` when comparing sensitive secrets. Ensure inputs are converted to Buffers and their lengths match before comparison to prevent length oracle errors.
