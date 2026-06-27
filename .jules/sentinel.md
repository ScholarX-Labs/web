## 2024-11-20 - [Fix timing attack vulnerability in API key comparison]
**Vulnerability:** The internal API key check was using strict equality (`===`) which is vulnerable to timing attacks. This allows an attacker to guess the API key character by character by measuring the time it takes for the server to reject the request.
**Learning:** Using standard string comparisons for secrets is dangerous because they exit early on the first mismatched character, creating a measurable timing difference.
**Prevention:** Always use constant-time string comparison methods like `crypto.timingSafeEqual` when comparing secrets, API keys, or passwords. Ensure both the expected and provided strings are converted to Buffers of equal length before comparison.
