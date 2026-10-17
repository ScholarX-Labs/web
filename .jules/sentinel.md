
## 2025-02-14 - Fix Timing Attack in Internal API Key Validation
**Vulnerability:** The API key validation in `src/app/api/admin/storage-check/route.ts` used strict string equality (`===`) to compare the provided `x-internal-key` header with the expected `INTERNAL_API_KEY` environment variable. This allows an attacker to perform a timing attack to brute-force the API key character by character.
**Learning:** Comparing sensitive secrets, API keys, or tokens using standard string equality introduces length oracle and timing vulnerabilities. The comparison terminates early when characters do not match, revealing partial correctness.
**Prevention:** Always use a constant-time comparison function, such as `crypto.timingSafeEqual`, when verifying sensitive values. Ensure both strings exist and their byte lengths are strictly matched (`buffer1.length === buffer2.length`) prior to calling `timingSafeEqual`.
