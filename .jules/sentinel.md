## 2024-05-24 - [Fix API Key Timing Attack]
**Vulnerability:** The API endpoint `src/app/api/admin/storage-check/route.ts` used a simple string comparison (`===`) to check the `x-internal-key` against `process.env.INTERNAL_API_KEY`.
**Learning:** Simple string comparisons for secrets are susceptible to timing attacks, where an attacker measures the time it takes the server to reject a key to guess it character by character.
**Prevention:** Use `crypto.timingSafeEqual` with a length check for constant-time comparison when verifying secrets, tokens, or API keys.
