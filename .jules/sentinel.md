## 2024-08-22 - Prevent timing attacks with crypto.timingSafeEqual
**Vulnerability:** Comparing secrets and keys, such as `INTERNAL_API_KEY` with standard string comparison (`===`) allows timing attacks to potentially deduce the secret character by character.
**Learning:** Checking lengths first and then strictly employing `crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(expectedKey))` creates a constant-time comparison that does not leak any information about where differences occurred.
**Prevention:** Always use constant-time algorithms (like `crypto.timingSafeEqual`) from `node:crypto` rather than strict equality `===` or `==` when comparing keys, hashes, tokens, passwords, or any sensitive API secrets.
