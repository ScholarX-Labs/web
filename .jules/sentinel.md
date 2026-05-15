## 2024-05-15 - [🛡️ Sentinel: Replace Math.random() with crypto.randomUUID() for secure ID generation]
**Vulnerability:** Weak random number generation using Math.random() for idempotency keys, component IDs, and username suffixes.
**Learning:** Usage of Math.random() in identifiers can lead to predictability, collision, or potential security vulnerabilities compared to a cryptographically secure pseudo-random number generator (CSPRNG).
**Prevention:** Always use crypto.randomUUID() or crypto.getRandomValues() when available for generating IDs, tokens, or unique keys, with graceful fallbacks for older environments.
