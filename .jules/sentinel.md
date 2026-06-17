# Sentinel Journal

## 2024-06-17 - [Timing Attack & Authentication Bypass]
**Vulnerability:** A simple string equality (`===`) was used to check the `x-internal-key` header against `process.env.INTERNAL_API_KEY`, exposing a timing attack vulnerability.
**Learning:** Comparing security tokens or API keys must be constant-time to prevent attackers from guessing keys. Furthermore, using `timingSafeEqual` with potentially empty strings (e.g. if the env var and header are missing) can cause false positives (authentication bypass) or `RangeError` if the lengths are un-matched strings converted to buffer.
**Prevention:** Always use `crypto.timingSafeEqual`, verify both sides are truthy and not empty, and compare their Buffer byte lengths (`buf1.length === buf2.length`) before calling `timingSafeEqual`.
