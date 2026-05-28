## 2024-05-28 - [Timing Attack Risk on Internal API Key]
**Vulnerability:** The internal API key check on the `/api/admin/storage-check` endpoint used strict string equality (`===`) for validation. This could potentially allow an attacker to guess the API key character-by-character through a timing attack.
**Learning:** Checking secure values like API keys, secrets, or hashes with strict equality exposes timing information because string comparisons abort early on the first mismatch.
**Prevention:** Use `crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))` to ensure constant-time comparison, guarding against timing attacks. Always verify buffer lengths are equal before calling it to prevent `RangeError`.
