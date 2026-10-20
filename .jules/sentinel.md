## 2023-10-25 - Timing Attack Vulnerability in API Key Validation
**Vulnerability:** A simple string equality operator (`===`) was used to compare `x-internal-key` against `INTERNAL_API_KEY`, creating a potential timing attack vulnerability as string comparison fails fast on the first mismatched character.
**Learning:** Checking string equality character-by-character can reveal the contents of secrets over time by measuring response latencies.
**Prevention:** Use `crypto.timingSafeEqual` after converting both inputs to Buffers and verifying they are the same length. Never fall back to empty strings when keys are missing.
