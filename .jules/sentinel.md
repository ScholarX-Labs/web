## 2024-05-15 - Fixed Timing Attack Vulnerability in API Key Comparison
**Vulnerability:** The API endpoint `src/app/api/admin/storage-check/route.ts` used strict equality (`===`) to compare the provided `x-internal-key` against `process.env.INTERNAL_API_KEY`.
**Learning:** This approach is vulnerable to timing attacks as string comparison stops at the first differing character, leaking the length and characters of the internal secret.
**Prevention:** Always use `crypto.timingSafeEqual` with `Buffer` length checks to ensure comparison time is constant when validating secrets.
