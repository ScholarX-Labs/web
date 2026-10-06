## 2026-10-06 - Fix Timing Attack Vulnerability in Internal API Key Comparison
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being compared using strict equality (`===`). This allows attackers to perform a timing attack to guess the key byte by byte.
**Learning:** Even internal API keys or shared secrets used for system-to-system authentication must be verified using constant-time string comparison methods when verified by the application. Checking `Buffer.length` first is also crucial, otherwise multi-byte character length variations could lead to length oracle vulnerabilities or TypeErrors.
**Prevention:** Always use `crypto.timingSafeEqual` along with a length check when comparing sensitive API keys or shared secrets in Node.js environments.
