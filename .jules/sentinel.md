## 2025-02-18 - Timing Attack Vulnerability in Internal API Keys
**Vulnerability:** The application was using strict equality (`===`) to compare the provided `x-internal-key` against the expected `INTERNAL_API_KEY` from process.env.
**Learning:** This exposes the application to timing attacks, allowing attackers to incrementally discover the valid API key character by character by measuring the response time. Additionally, failing to verify the existence of the keys could lead to an auth bypass if both keys fall back to an empty or undefined state.
**Prevention:** Always use `crypto.timingSafeEqual` with Buffers of equal length to compare secrets in constant time. Ensure both the provided and expected keys exist before comparison to avoid bypass attacks.

## 2025-02-18 - Sharp Dependency Configuration in Edge Deployments
**Vulnerability:** The Vercel OpenNext deployment on Cloudflare failed because `sharp` (an image optimization library) could not be resolved when building the Edge worker context.
**Learning:** Certain native Node.js binaries or libraries like `sharp` need to be correctly included in dependencies/devDependencies and resolved by the ESBuild toolchain that OpenNext uses to bundle for Cloudflare Workers.
**Prevention:** Ensure `sharp` is correctly defined in dependencies (and ideally updated to a compatible version) and the Next.js `open-next.config.ts` configuration enables proper Edge/Node proxy modes for external API boundaries when relying on native binaries.
