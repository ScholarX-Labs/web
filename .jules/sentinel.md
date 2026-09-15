## 2024-05-18 - Timing Attack in Internal API Key Validation
**Vulnerability:** Internal API key validation used strict string equality (`===`) (`request.headers.get("x-internal-key") === process.env.INTERNAL_API_KEY;`), which is vulnerable to timing attacks. Attackers can guess characters one by one based on response time.
**Learning:** Comparing secrets and API keys must always be done in constant time to prevent leaking the secret via timing information.
**Prevention:** Always use `crypto.timingSafeEqual` with Buffers of equal length to compare secrets securely.
