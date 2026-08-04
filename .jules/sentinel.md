## 2024-08-04 - [Fix Timing Attack Vulnerability in Secret Comparison]
**Vulnerability:** Timing attack vulnerability due to strict equality (`===`) comparison of secrets.
**Learning:** Strict equality comparison of strings can leak the secret key character by character by taking slightly longer for each correct character matched. This can allow an attacker to guess the secret key over multiple requests.
**Prevention:** Always use `crypto.timingSafeEqual` with Buffers for comparing sensitive strings like API keys, tokens, or passwords to ensure constant-time comparison. Also, handle `null` or `undefined` expected keys properly to prevent authentication bypass.
