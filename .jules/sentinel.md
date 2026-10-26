## 2024-05-18 - [Fix Timing Attack Vulnerability in Storage Check API]
**Vulnerability:** String comparison (`===`) was used to validate `x-internal-key` against `INTERNAL_API_KEY`, which is susceptible to timing attacks. An attacker could measure the time taken to reject a key and slowly deduce the correct key character by character.
**Learning:** Even internal API keys must be compared using constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks, especially on public-facing internet routes.
**Prevention:** Always use `crypto.timingSafeEqual` after checking lengths match (to prevent `TypeError`) when comparing any secrets, API keys, or tokens in Node.js/Next.js backend routes.
