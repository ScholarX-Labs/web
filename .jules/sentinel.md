
## 2024-09-30 - Insecure API Key Comparison timing attack
**Vulnerability:** The internal API endpoint `/api/admin/storage-check` compared the `x-internal-key` header with the expected `INTERNAL_API_KEY` using strict equality (`===`), making it susceptible to timing attacks.
**Learning:** Checking strict equality stops comparing characters at the first mismatch. Attackers can repeatedly guess keys and observe response times to deduce valid portions of secrets character by character. Additionally, using standard `timingSafeEqual` directly can cause unhandled exceptions if the strings' lengths differ or if empty string fallbacks are inappropriately used.
**Prevention:** Always use `crypto.timingSafeEqual` for comparing secrets, API keys, or HMAC signatures. Ensure inputs are converted to Buffers, explicitly check if both are truthy, and verify that their byte lengths are equal before calling `timingSafeEqual` to avoid RangeErrors.
