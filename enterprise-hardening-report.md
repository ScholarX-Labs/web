# Enterprise hardening report

## Scope

Static review of the supplied ScholarX Next.js application, with targeted fixes that do not alter the visual UI, layout, colors, typography, spacing, or user flows.

## Implemented fixes

### Public health endpoint information disclosure — fixed

**Problem:** `GET /api/health` returned runtime configuration presence, port, environment name, and raw database errors.

**Why it matters:** Public health endpoints are frequently probed. This data helps an attacker map deployment secrets and database providers, while raw database errors can reveal hostnames, schema details, or credentials.

**Impact:** The endpoint now returns only the minimum liveness/readiness contract: `status` and database availability. Failures return `503` rather than `500`, which correctly signals temporary dependency unavailability to load balancers.

**Production/scalability:** The existing lightweight `SELECT 1` dependency check remains unchanged. No client-visible interface or UI was changed.

### Missing baseline browser security headers — fixed

**Problem:** The Next.js configuration did not set core defensive response headers.

**Why it matters:** Browsers otherwise have weaker defaults for MIME sniffing, framing, referrer disclosure, and powerful device APIs.

**Impact:** All responses now send:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restricting camera, microphone, geolocation, payment, and USB APIs

These headers are UI-neutral and add no client JavaScript or runtime data fetches.

## Review observations

- The application already contains typed request validation, server-side auth/session checks, rate-limit infrastructure, environment validation, domain-layer services, Redis support, Sentry wiring, and image host allow-listing.
- The reviewed JSON-LD usage serializes component data rather than rendering arbitrary HTML. Continue to keep user-controlled content out of `dangerouslySetInnerHTML`; when JSON-LD incorporates strings, escape `<` as `\\u003c` as defense in depth.
- Avoid adding a restrictive Content-Security-Policy without a staged report-only rollout: this application uses analytics, Sentry, and inline framework assets, so an untested CSP could break production behaviour despite no visual design change.

## Verification status

Source-level verification was completed. Automated `pnpm`, `node`, and `git` checks could not be run because those executables are not installed or available in the provided execution environment. Before deployment, run from the project root:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Then verify `/api/health` returns no environment or raw error details, and inspect live response headers in a staging deployment.
