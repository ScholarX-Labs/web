## 2025-02-18 - Timing Attack Vulnerability in Internal API Keys
**Vulnerability:** The application was using strict equality (`===`) to compare the provided `x-internal-key` against the expected `INTERNAL_API_KEY` from process.env.
**Learning:** This exposes the application to timing attacks, allowing attackers to incrementally discover the valid API key character by character by measuring the response time. Additionally, failing to verify the existence of the keys could lead to an auth bypass if both keys fall back to an empty or undefined state.
**Prevention:** Always use `crypto.timingSafeEqual` with Buffers of equal length to compare secrets in constant time. Ensure both the provided and expected keys exist before comparison to avoid bypass attacks.
