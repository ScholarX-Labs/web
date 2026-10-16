## 2023-10-16 - Prevent Timing Attacks on API Keys
**Vulnerability:** Comparing API keys using strict equality (`===`) exposes the application to timing attacks, allowing an attacker to deduce the correct key by observing response times.
**Learning:** Even internal API keys must be compared using constant-time algorithms to prevent side-channel attacks.
**Prevention:** Always use `crypto.timingSafeEqual` with `Buffer` objects and explicit length checks when comparing sensitive strings like API keys, secrets, or tokens.
