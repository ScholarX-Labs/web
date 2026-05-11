## 2025-02-14 - Timing attack when verifying API Key
**Vulnerability:** Comparing an API key provided in a request header to an expected environment variable using the strict equality (`===`) operator. Since `===` checks characters sequentially and returns immediately upon the first difference, an attacker can use timing differences to deduce the secret key character by character.
**Learning:** This repo lacked the use of constant-time string comparisons. Standard string comparison operators in Javascript/TypeScript evaluate in linear time, dependent on string match length.
**Prevention:** Use `crypto.timingSafeEqual` after converting both values to identical-length buffers to protect API key matching and any other secret comparisons against timing attacks.
