## 2024-05-18 - [Timing Attack Vulnerability in API Key Comparison]
**Vulnerability:** Used strict equality `===` instead of `crypto.timingSafeEqual` for checking the internal API key.
**Learning:** Checking equality of sensitive strings (e.g. passwords, secrets, API keys) via strict equality can be vulnerable to timing attacks. Attackers can deduce the exact API key character by character by analyzing the response times.
**Prevention:** Always use `crypto.timingSafeEqual` and convert inputs to Buffers first (ensuring matching buffer lengths before comparison) to prevent timing discrepancies.
