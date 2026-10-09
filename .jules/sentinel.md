
## 2024-05-18 - [Timing Attack in Internal API Key Verification]
**Vulnerability:** The internal API endpoint for storage checks authenticated requests using a strict equality (`===`) comparison against the `INTERNAL_API_KEY`.
**Learning:** Using `===` for secret strings allows timing attacks. Since standard equality checks fail fast on the first mismatched character, an attacker could theoretically deduce the secret key character-by-character based on the time it takes the comparison to fail.
**Prevention:** Always use `crypto.timingSafeEqual` when comparing sensitive strings like API keys, secrets, or tokens. Ensure both inputs are first converted to Buffers and that their byte lengths are identical before calling `timingSafeEqual` (never check `.length` of raw strings instead, as multi-byte characters will pass the check but cause unequal buffer sizes, resulting in a length oracle or a `TypeError`). Also, check that both keys exist to avoid falling back to empty strings.
