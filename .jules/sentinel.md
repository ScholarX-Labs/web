## 2026-10-13 - [Sentinel: Timing attack in API key validation]
**Vulnerability:** A timing attack vulnerability was identified in the API key validation logic due to the use of a standard equality operator (`===`) for comparing the internal API key.
**Learning:** Using `===` for cryptographic or secret comparisons allows attackers to measure the time taken to reject a request, potentially enabling them to guess the key character by character.
**Prevention:** Always use `crypto.timingSafeEqual` with matching buffer lengths when comparing secrets or API keys to ensure constant-time comparison and mitigate timing attacks.
