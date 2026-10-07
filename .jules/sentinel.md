## 2024-10-06 - [Fix Timing Attack Vulnerability in INTERNAL_API_KEY Comparison]
**Vulnerability:** The internal API key in `src/app/api/admin/storage-check/route.ts` was being checked using strict equality (`===`), making it vulnerable to a timing attack where an attacker could theoretically guess the key character by character by measuring the response time.
**Learning:** Next.js API routes may contain custom internal authentication checks that are susceptible to timing attacks if they use standard string comparison for secrets.
**Prevention:** Use `crypto.timingSafeEqual` with Buffers for comparing sensitive strings, taking care to ensure the lengths match before the comparison to prevent `TypeError` exceptions.
