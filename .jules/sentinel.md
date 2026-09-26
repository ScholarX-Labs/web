## 2024-05-18 - Fix timing attack vulnerability in API key validation
**Vulnerability:** The API key validation in `src/app/api/admin/storage-check/route.ts` used a strict equality operator (`===`) to compare the provided key with the expected key, which is susceptible to timing attacks.
**Learning:** Comparing secrets using standard string equality allows attackers to potentially guess the secret by measuring the time it takes for the comparison to fail.
**Prevention:** Always use `crypto.timingSafeEqual` after converting secrets to buffers and ensuring they have the same byte length to prevent timing attacks.
