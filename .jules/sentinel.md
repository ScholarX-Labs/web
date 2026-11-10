## 2024-11-10 - [Fix timing attack in admin storage-check API]
**Vulnerability:** Comparing API keys using standard equality operators (`===`) allows timing attacks, where an attacker can determine the secret key character-by-character based on the response time.
**Learning:** We must use a constant-time string comparison function to validate incoming secrets against environment variables. Converting to Buffer and doing a length check is necessary prior to `timingSafeEqual`.
**Prevention:** Always use `crypto.timingSafeEqual` with careful length checks and fallback to false when verifying API keys, tokens, or other secrets.
