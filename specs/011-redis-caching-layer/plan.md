# Implementation Plan: Shared Redis Caching Layer

**Branch**: `011-redis-caching-layer` | **Date**: May 23, 2026 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/011-redis-caching-layer/spec.md`

---

## Summary

ScholarX needs one production-grade shared caching and distributed-control layer for public
discovery reads, repeated aggregate admin reads, runtime configuration, and rate limits.
The implementation uses the already-installed Upstash Redis packages behind a narrow
server-only cache port, then composes domain-specific decorators around the existing course,
opportunity, profile, certificate, admin, config, and rate-limit boundaries.

The main design goal is not "put Redis everywhere." It is to: classify every surface by data
sensitivity, cache only normalized safe DTOs, make invalidation explicit and atomic at mutation
boundaries, keep route handlers thin, and ensure every failure mode degrades gracefully. Public
cache entries must never contain session, enrollment, learner progress, raw email content,
secrets, or admin authorization decisions.

---

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16 App Router  
**Primary Dependencies**: Existing `@upstash/redis`, existing `@upstash/ratelimit`, Drizzle ORM,
Better Auth, Zod, TanStack React Query, Sentry/telemetry where available  
**Storage**: PostgreSQL remains source of truth; Upstash Redis becomes shared cache,
distributed rate-limit store, short-lived config cache, and invalidation tag index  
**Testing**: Node test runner with `tsx`, TypeScript typecheck, focused unit tests for
cache policy/key/invalidation, service decorator tests, route tests for rate limits and
stale/fallback behavior, and explicit chaos/fault-injection tests for Redis outage paths  
**Target Platform**: ScholarX Next.js web app plus existing worker processes  
**Performance Goals**:
- 95% of repeated public catalog/detail reads under 500 ms
- 95% of repeated opportunity detail reads under 700 ms
- Admin aggregate repeated read load reduced by at least 50%
- Distributed limit consistency ≥ 99.9% in multi-instance tests

**Constraints**:
- No public caching of personalized data
- No server-only imports in Client Components
- No Redis SDK imports in route/page/UI files
- Route handlers remain validation/orchestration only
- Cache must be bypassable globally and per surface via environment variable
- Risky write limits fail closed when Redis is unavailable
- Upstash HTTP client initialized as a module-level singleton per serverless instance,
  never per request; read timeout 1 500 ms, connect timeout 500 ms
- **Redis eviction policy**: Upstash instance must be configured with `maxmemory-policy = volatile-lru`.
  `noeviction` is explicitly prohibited — it converts memory exhaustion into request failures
  that trigger the circuit breaker. `volatile-lru` evicts TTL-keyed entries under pressure,
  causing cache misses (acceptable) rather than errors (not acceptable).

**Dependency Pinning**:
- `@upstash/redis` and `@upstash/ratelimit` must be pinned to exact versions in `package.json`.
  Do not accept minor-version auto-upgrades without reviewing changelogs for changes to `pipeline()`,
  `eval()`, and window-algorithm behavior. The Lua eval interface (tag atomicity) is the most
  sensitive API surface — any behavioral change would silently break the atomicity guarantee.
- Upgrade process: any version bump requires re-running the full cache integration and chaos
  test suite before merging. Add a `package.json` note or a CI check to enforce this.

**Scale/Scope**: Public course, opportunity, profile, certificate, admin aggregate/list, runtime
config, and rate-limit surfaces for horizontally scaled ScholarX deployments; no migration of
durable business state into Redis.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Plan Response |
|-----------|--------|---------------|
| Proper Architecture & SOLID Patterns | PASS | Narrow cache/rate-limit ports, Upstash adapters, key/policy helpers, circuit breaker, stampede protection, and domain decorators. Redis remains infrastructure, not business logic. |
| Uncompromising Code Quality & Type Safety | PASS | Typed cache policies (including required `negativeTtlSeconds`), typed JSON codecs with schema version management, normalized DTOs, Zod where data crosses untyped boundaries, no `any` in new logic. |
| Rigorous Testing Standards | PASS | Unit tests for keys/TTL/stale/invalidation; integration tests for decorator behavior; chaos tests for Redis outage, partial pipeline failure, stampede lock crash, and clock skew. |
| Premium User Experience Consistency | PASS | No UI redesign. Impact is faster public/admin responses and stable error/retry behavior with consistent Retry-After responses. |
| Performance, Scalability & Maintainability | PASS | Shared cache reduces repeated expensive reads and coordination gaps while preserving source-of-truth ownership and supporting horizontal scaling. |

No constitution violations are required.

---

## Project Structure

### Documentation (this feature)

```text
specs/011-redis-caching-layer/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── cache-port-contract.md
│   ├── cache-policy-catalog.md
│   └── distributed-rate-limit-contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── cache/
│   │   ├── cache.port.ts            # CachePort interface + types
│   │   ├── cache-key.ts             # Key builder + canonical hash
│   │   ├── cache-policy.ts          # CachePolicy type + policy registry
│   │   ├── cache-codec.ts           # CacheEntryEnvelope encode/decode
│   │   ├── cache-metrics.ts         # CacheHealthSignal emission
│   │   ├── cache-circuit-breaker.ts # CircuitBreakerPolicy + state machine
│   │   ├── cache-stampede.ts        # XFetch + distributed mutex logic
│   │   ├── cache.factory.ts         # Singleton factory + DI wiring
│   │   ├── upstash-cache.adapter.ts # Upstash Redis implementation
│   │   └── memory-cache.adapter.ts  # In-memory adapter for tests/local
│   ├── rate-limit/
│   │   ├── distributed-rate-limiter.port.ts  # DistributedRateLimiter interface
│   │   ├── upstash-rate-limiter.adapter.ts   # Upstash ratelimit implementation
│   │   ├── memory-rate-limiter.adapter.ts    # In-memory adapter for tests
│   │   └── rate-limit.factory.ts             # Factory + rule registry
│   ├── app-config.ts         # Runtime config with shared cache (replaces local Map)
│   ├── rate-limiter.ts        # Facade kept for backward compatibility
│   └── admin/
│       └── rate-limiter.ts    # Admin-specific rules delegating to port
├── domain/
│   ├── courses/
│   │   ├── application/
│   │   │   └── cached-course-catalog.service.ts  # Cache decorator over existing service
│   │   └── factory/
│   │       └── next-course-domain.factory.ts      # Wires cached service
│   ├── admin/
│   │   ├── application/
│   │   │   ├── cached-admin-reports.service.ts
│   │   │   └── cached-admin-stats.service.ts
│   │   └── factory/
│   │       └── admin-domain.factory.ts
│   └── certificates/
│       ├── application/
│       │   └── cached-certificate-verification-query.service.ts
│       └── factory/
│           └── certificate-services.factory.ts
├── actions/
│   ├── public-profile.actions.ts  # Cache invalidation on profile mutations
│   └── profile.actions.ts         # Cache invalidation on privacy/avatar/account changes
└── lib/
    └── ai-search/
        ├── api.ts                  # Existing API boundary
        └── opportunity-cache.ts    # Cache decorator + cardinality controls
```

**Structure Decision**: The cache core belongs in `src/lib/cache` because it is cross-cutting
infrastructure. Domain-specific cache decisions belong next to the owning domain service.
Route handlers keep calling their current domain factories unchanged.

---

## Phase 0 Research

Research is captured in [research.md](./research.md). Key resolved decisions:

| Topic | Decision |
|-------|----------|
| Redis provider | Use existing Upstash Redis packages already in `package.json`. |
| Cache abstraction | Server-only cache port and typed adapter. Redis stays infrastructure. |
| Cache granularity | Cache normalized DTOs at domain/service boundaries, not raw rows. |
| Invalidation | Explicit tag/version invalidation via Lua-atomic Redis index sets plus bounded TTLs. |
| Failure behavior | Public reads fall back to source or safe-stale; risky writes fail closed. |
| Rate limits | Consolidate behind distributed limiter port using `slidingWindow` for risky surfaces. |
| Observability | Structured metrics for all cache/limiter outcomes plus circuit breaker state. |
| Stampede protection | XFetch for most surfaces; distributed mutex for privacy-sensitive surfaces. |
| Schema versioning | Current version is `1`; bumped on breaking payload shape changes. |

---

## Phase 1 Design

Design artifacts:

- [data-model.md](./data-model.md): cacheable surfaces, policies, envelopes, invalidation events, limit rules, health signals, and state machines.
- [contracts/cache-port-contract.md](./contracts/cache-port-contract.md): server-only cache port, circuit breaker, stampede protection spec, tag atomicity requirements.
- [contracts/cache-policy-catalog.md](./contracts/cache-policy-catalog.md): per-surface policies, required negative TTLs, invalidation events including admin role revocation.
- [contracts/distributed-rate-limit-contract.md](./contracts/distributed-rate-limit-contract.md): rate limit port, algorithm selection, actor key construction.
- [quickstart.md](./quickstart.md): environment variables, monitoring baseline, alert thresholds, canary deployment, rollback.

---

### Architecture

#### Shared Cache Core

Add a `server-only` cache module with these responsibilities:

- Create namespaced keys using stable canonical normalization (see §Cache Key Design).
- Encode/decode typed JSON envelopes with `schemaVersion`, `surfaceId`, `createdAt`,
  `freshUntil`, `staleUntil`, and `tags`.
- Support `get`, `set`, `getOrSet`, `delete`, `invalidateTags`, and `getStatus`.
- Apply circuit breaker state transitions on Redis errors.
- Apply stampede protection (XFetch or distributed mutex) per surface policy.
- Use atomic Lua script (or MULTI/EXEC pipeline) for `SET + tag-index SADD` operations.
- Expose a no-op or in-memory adapter for tests and local development without Redis credentials.
- Centralize Redis health/circuit behavior and metrics emission.

The cache port must not know about courses, certificates, profiles, admin reports, or
opportunities. Domain services own the policy and decide whether a cache result is safe to use.

---

#### Cache Key Design

Use a versioned namespace:

```text
sx:v1:{surface}:{scope}:{canonical-hash-or-id}
```

**Examples**:

- `sx:v1:courses:list:anonymous:{canonicalHash(filters)}`
- `sx:v1:courses:detail:public:{slugOrId}`
- `sx:v1:courses:lessons:public:{courseId}`
- `sx:v1:opportunities:detail:{lang}:{id}`
- `sx:v1:profiles:public:{username}`
- `sx:v1:certificates:public:{certificateNumber}`
- `sx:v1:admin:stats:{sha256(userId).slice(0,16)}`
- `sx:v1:config:{key}`
- `sx:v1:ratelimit:{surface}:{actorHash}`

**Canonical Hash Algorithm** (required for any `{hash}` component):

```ts
import { createHash } from "node:crypto";

/**
 * Produces a stable, order-independent hash for an arbitrary filter/params object.
 * Recursively sorts object keys before serializing to eliminate key-ordering variance.
 */
function canonicalHash(input: unknown): string {
  const sorted = sortObjectKeys(input);          // recursive key sort
  const json = JSON.stringify(sorted);           // deterministic serialization
  return createHash("sha256")
    .update(json, "utf8")
    .digest("hex")
    .slice(0, 24);                               // 24-char prefix; ~96 bits of collision resistance
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value !== null && typeof value === "object") {
    return Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortObjectKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}
```

**Key construction rules**:

- Never include raw email addresses, full IP addresses, bearer tokens, session IDs, or raw request bodies.
- Hash sensitive actor identifiers before key construction.
- Pagination parameters (`page`, `limit`, `cursor`) must be part of the hash input, not appended raw, to prevent key injection.
- Language/locale codes may be included raw (e.g., `en`, `fr`) as they are low-cardinality and non-sensitive.

**Tag index key format**:

```text
sx:v1:tag:{tag-name}      → Redis SET (SADD) of cache keys with this tag
```

Tag index TTL must be set to `max(entry staleTtlSeconds across all tagged entries) + 86400`
to prevent unbounded index growth while keeping pointers alive long enough to be useful.

---

#### Upstash Client Initialization

The Upstash HTTP client must be initialized **once per serverless instance** at module level,
not per request. Repeated instantiation adds unnecessary HTTP overhead.

```ts
// src/lib/cache/cache.factory.ts

import { Redis } from "@upstash/redis";

// Module-level singleton — initialized once when the module is first imported
const _redisClient: Redis | null = process.env.UPSTASH_REDIS_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN ?? "",
      // Prevent cache latency from cascading into user-facing response time
      agent: undefined, // use default Upstash fetch agent
      // Custom fetch with timeout (Upstash SDK supports AbortSignal via fetch)
    })
  : null;

export function getRedisClient(): Redis | null {
  return _redisClient;
}
```

**Timeout configuration**: Wrap Upstash `fetch` calls with an `AbortSignal.timeout(1500)` for
reads and `AbortSignal.timeout(2000)` for writes. This prevents Redis latency from cascading
into user-facing request latency. When a timeout fires, the adapter treats the result as a
transient error and applies the circuit breaker failure counter.

**Production tier requirement**: Upstash free tier is rate-limited to ~100 requests/second.
Production deployments must use the Upstash Pro or Pay-As-You-Go tier. Document the required
tier in `quickstart.md`.

---

#### Codec Design (Serialization Rules)

The `cache-codec.ts` module must enforce strict serialization contracts to prevent silent
data corruption on cache round-trips. All of the following rules are **required**:

```
Rule 1 — Dates are strings at the cache boundary:
  All Date fields in cached DTOs must be typed as ISO strings (string, not Date).
  JSON.stringify(new Date()) produces a string; JSON.parse does not restore a Date object.
  The normalized DTO types used as cache payloads must use string for all timestamp fields.
  No Date objects cross the encode/decode boundary.

Rule 2 — BigInt is prohibited in cached DTOs:
  JSON.stringify(BigInt(1)) throws TypeError. Any domain type that uses BigInt must be
  converted to a number or string before reaching the cache encode path.
  The codec must assert absence of BigInt via a custom JSON replacer that throws on BigInt.

Rule 3 — undefined values are converted to null:
  JSON.stringify silently drops undefined-valued keys, causing shape drift between cache
  writes and reads. The codec's JSON replacer must convert undefined to null explicitly.
  DTO types must use T | null (not T | undefined) for optional fields in cached shapes.

Rule 4 — NaN and Infinity are prohibited in numeric fields:
  JSON.stringify converts NaN and Infinity to null. The Zod validator applied at decode time
  must use z.number().finite() (not z.number()) for all numeric fields to reject these values.
  The encode path must also validate that no numeric field is NaN or Infinity before writing.

Rule 5 — Structural Zod validation at decode:
  Every surface must provide a Zod schema (or equivalent structural validator) used at
  decode time. Generic JSON.parse is insufficient. A malformed or structurally incorrect
  payload must return { status: "miss" }, not a partially-typed object.
```

**Gzip Compression**:

The codec must apply gzip compression for serialized envelopes larger than 1 KB before
writing to Redis. Decompression is applied transparently at decode time.

```ts
// Pseudocode — implement in cache-codec.ts
const COMPRESS_THRESHOLD_BYTES = 1024;

async function encode<T>(policy: CachePolicy, value: T): Promise<string> {
  const json = JSON.stringify(buildEnvelope(policy, value), safeReplacer);
  if (json.length < COMPRESS_THRESHOLD_BYTES) return json;
  const buf = await gzip(Buffer.from(json, 'utf8'));       // node:zlib
  return `gz:${buf.toString('base64')}`;                  // gz: prefix signals compressed entry
}

async function decode<T>(raw: string, schema: ZodSchema<T>): Promise<T | null> {
  const json = raw.startsWith('gz:')
    ? (await gunzip(Buffer.from(raw.slice(3), 'base64'))).toString('utf8')
    : raw;
  const envelope = JSON.parse(json);                      // schema version check happens next
  const result = schema.safeParse(envelope.payload);
  return result.success ? result.data : null;              // null → treated as miss by adapter
}
```

Compression reduces Redis memory by ~60–80% for typical JSON payloads. Admin report entries
(which can reach 100–200 KB uncompressed) benefit most. Benchmark the compression overhead
during load testing; for payloads < 1 KB the overhead is skipped entirely.

---

#### Cache Policies By Surface

See [contracts/cache-policy-catalog.md](./contracts/cache-policy-catalog.md) for the authoritative
policy table including negative TTLs, stampede mechanism, and all invalidation events.

Summary:

| Surface | Cache | Fresh TTL | Stale TTL | Negative TTL | Jitter | Max Payload | Stampede |
|---------|-------|-----------|-----------|--------------|--------|-------------|----------|
| Public course list/categories | Yes | 60s | 10m | 30s | +10s | 256 KB | XFetch |
| Public course detail/lessons | Yes | 60s | 10m | 30s | +10s | 128 KB | XFetch |
| Enrollment/progress/subscription | **No shared cache** | — | — | — | — | — | — |
| Opportunity detail by id/lang | Yes | 6h | 24h | 60s | +30m | 256 KB | XFetch |
| Opportunity search query | Yes (cardinality-controlled) | 5m | 30m | 30s | +30s | 128 KB | XFetch |
| Public scholar profile | Yes | 60s | 10m | 30s | +10s | 32 KB | XFetch |
| Public certificate verification | Yes | 30s | 5m | 30s | +5s | 32 KB | Mutex |
| Certificate artifact status | Yes | 5s | 30s | 10s | +1s | 8 KB | Mutex |
| Admin overview stats | Yes, admin-scoped | 30s | 2m | — | +5s | 64 KB | XFetch |
| Admin reports | Yes, admin-scoped | 60s | 5m | — | +10s | 512 KB | XFetch |
| Admin paginated lists | Yes, admin-scoped | 30s | 2m | — | +5s | 128 KB | XFetch |
| Runtime config | Yes | 60s | 5m | 30s | +10s | 16 KB | XFetch |

---

#### Course Integration

Wrap public catalog reads in a cache decorator while preserving user-specific enrichment:

- Cache anonymous/base public results for `list`, `listCategories`, `getBySlug`, `getById`, and public lesson summaries.
- Do not cache `findActiveSubscriptionsByUser`, `findActiveSubscription`, `findProgressByCourse`, or `findLessonProgress` in shared public entries.
- Merge user-specific subscription/progress state **after** reading the cached public base DTO.
- Invalidate course tags from admin course/lesson mutations and enrollment operations that change public counts such as `studentsCount`.

Integration point: `createNextCourseDomain` composes the catalog service with cache dependencies.
Route handlers keep using the factory unchanged.

---

#### Opportunity Integration

Add a cache decorator in `src/lib/ai-search/opportunity-cache.ts`:

- Cache `getOpportunityById(id, lang)` after normalization.
- Cache `searchScholarships(query)` by canonical query hash with a shorter TTL and cardinality controls:
  - Skip caching for queries > 100 characters after normalization.
  - Skip caching for queries with injection-pattern characters.
  - Apply: lowercase → trim → collapse spaces → sort filter keys → `canonicalHash`.
- Serve safe stale results on upstream 5xx/network errors when available.
- Preserve existing `null` behavior for not-found results with a short negative-cache TTL.
- Emit `opportunities:search` key count metric when cardinality exceeds the 10,000 threshold.

---

#### Public Profile Integration

Move direct public profile lookup behind `src/lib/profile/public-profile-cache.ts`:

- Cache only the currently selected public fields (the normalized public DTO).
- Cache negative result (unknown username) with the configured negative TTL.
- Invalidate on: profile field update, social link update, avatar upload, privacy toggle,
  username change, and account deletion.
- Never include private account settings, email verification internals, auth data, or
  non-public profile fields.
- Privacy toggle and account deletion invalidations must be synchronous (immediate priority).

**GDPR / Right to Erasure (Article 17)**: When a user submits an account deletion request,
the deletion service must emit the `user.account_deleted` compound invalidation event,
which synchronously purges all cached representations of the user's data across every surface
(profile, admin stats, admin reports, admin lists). The invalidation tags are:

```
profile:{username}
profile-user:{userId}
admin:user:{userId}:stats
admin:user:{userId}:reports
admin:user:{userId}:lists
```

Rate-limit counters keyed to `sha256(userId)` expire naturally at window end. Their retention
is acceptable under GDPR because hashed keys cannot be reverse-mapped to a real identity.
If legal review determines otherwise, early deletion must be implemented as described in
`contracts/distributed-rate-limit-contract.md §Rate-Limit Counter Retention on Account Deletion`.

---

#### Certificate Integration

Decorate public certificate verification/status query methods:

- Cache `getPublicCertificate(certificateNumber)` — use distributed mutex (stampede-sensitive).
- Cache `getArtifactStatus(certificateNumber)` — use distributed mutex (short TTL, polling surface).
- Do not cache signed download URL generation or private storage keys.
- Invalidate on: issue, revoke, artifact ready, artifact failed, and regeneration state changes.
- Revocation invalidation must be synchronous (immediate priority).
- Keep verification event writes non-blocking and independent of cache reads.

---

#### Admin Integration

Cache admin aggregates and repeated list reads **only after admin authorization has succeeded**.
Use admin-scoped cache keys that include a hashed user identifier to prevent cross-admin leakage.

Cache:
- `getOverviewStats` → key includes `sha256(userId).slice(0,16)`
- `getRevenueReport`, `getUserReport`, `getCourseReport` → key includes user scope + date range hash
- High-read paginated list queries → key includes user scope + pagination hash

Do not cache: `resolveAdmin`, session, role, or per-request authorization results.

**Admin TOCTOU Mitigation**: When an admin role is revoked (`admin.role_revoked` event), the
mutation path must call `invalidateTags` synchronously with the user-scoped admin tags:
`admin:user:{userId}:stats`, `admin:user:{userId}:reports`, `admin:user:{userId}:lists`.
This is an immediate-priority invalidation event (see policy catalog). Short TTLs (30s/2m max)
provide an additional time-bounded safety net. Under no circumstances should admin cache entries
be served after role revocation has been committed to the database.

**Read-Your-Writes Consistency**: The user who performed a mutation (publish/archive a course,
revoke a role, update a profile) must see their own change immediately, even if the cache
was just invalidated. In a multi-instance deployment, a subsequent request from the same browser
may hit a different serverless instance that hasn't yet observed the invalidation.

Mechanism: **short-lived cache-bypass cookie** set on mutation response:

```
On mutation success response:
  Set-Cookie: sx-cache-bypass={surfaceId}:{expiryUnixMs}; Path=/; HttpOnly; SameSite=Strict

expiryUnixMs = Date.now() + (freshTtlSeconds * 1000) + 5000  // fresh TTL + 5s buffer

On the next request:
  If sx-cache-bypass cookie is present AND not expired AND surfaceId matches current route:
    Set policy.fallbackMode = "bypass" for this request only
    Clear the cookie in the response (Max-Age=0)
```

This pattern is used by Vercel (Draft Mode), Contentful, and WordPress for the same problem.
The cookie is `HttpOnly` (never readable by JavaScript) and `SameSite=Strict` (no cross-site
use). Its lifetime is bounded by the surface's fresh TTL, so it never persists longer than
the data could have been stale anyway.

Implementation location: middleware or route handler wrapper for admin mutation routes.
The cache port itself does not need to change — the cookie sets `fallbackMode: "bypass"` at
call time, which the `getOrSet` method already handles.

---

#### Runtime Config Integration

Replace the process-local config Map with shared cache. Precedence (highest wins):

1. Environment variable override (`process.env.FEATURE_X`)
2. Shared Redis cache entry for `sx:v1:config:{key}`
3. Database authoritative value

`setConfig` must: update the database → then atomically invalidate or overwrite the shared
cache entry for the affected key. The storage-check route must clear the shared key when
disabling avatar uploads. The negative TTL for unknown config keys prevents repeated DB reads
for keys that do not exist in the database.

---

#### Distributed Rate Limits

Consolidate all limits behind the `DistributedRateLimiter` port using `slidingWindow` for all
abuse-prevention rules:

- Existing avatar upload limiter already uses Upstash — move Redis construction into the shared factory.
- Replace in-memory admin API limiter with `admin.api.user.minute` distributed rule.
- Replace in-memory course application submission limiter with `course.application.user-resource.10m`.
- Add contact submission rule (`contact.submit.ip.hour`).
- Add public scraping throttles (`public.profile.ip.minute`, `opportunities.search.ip.minute`) as fail-open.
- All risky writes fail closed on Redis outage; low-risk public reads fail open with logging.

---

### Implementation Plan

1. **Cache infrastructure**: Add `src/lib/cache` — port, key builder (with canonical hash and TTL jitter),
   codec (with schema version `1`, gzip compression for payloads > 1 KB, and serialization rules),
   policy model (with `ttlJitterSeconds` and `maxPayloadBytes`), circuit breaker, stampede helpers
   (XFetch + mutex), metrics sink, memory adapter, Upstash adapter (with Lua atomic write + index
   management), and factory (with module-level singleton + timeout configuration).

2. **Rate limit infrastructure**: Add `src/lib/rate-limit` — distributed limiter port, Upstash
   adapter (using `slidingWindow` for risky rules), memory adapter, and factory. Preserve existing
   avatar limit behavior at the outer API boundary.

3. **Policy catalog constants**: Add typed policy objects for all surfaces in `src/lib/cache/cache-policy.ts`.
   Each surface policy includes `negativeTtlSeconds`, `stampedeProtection`, `stampedeAlgorithm`,
   and `enabledByDefault: false`.

4. **Unit tests — infrastructure**: Key normalization (canonical hash stability, order-independence),
   tag index atomicity (Lua script correctness), TTL/stale handling, codec schema version
   rejection, XFetch probability math, mutex lock acquire/release, circuit breaker state transitions,
   outage fallback for each `fallbackMode`, memory adapter parity with Upstash adapter behavior.

5. **Chaos tests — Redis outage simulation**: Configure memory adapter to simulate:
   - `SET` returns error → user request must succeed via `load()` fallback
   - `SMEMBERS` returns partial results during tag invalidation → `failedKeys > 0` metric emitted
   - `getOrSet` times out mid-execution → no stale value returned without logging
   - Mutex lock holder crashes (lock TTL expires) → second caller acquires lock and recomputes
   - Circuit opens after threshold → all reads bypass Redis and use `load()` or stale

6. **Course integration**: Wrap public catalog reads in `cached-course-catalog.service.ts`.
   Add invalidation calls to all admin course/lesson mutation services.

7. **Opportunity integration**: Add `opportunity-cache.ts` with cardinality controls, canonical
   query normalization, and safe-stale behavior on upstream errors.

8. **Profile integration**: Create `src/lib/profile/public-profile-cache.ts`. Add synchronous
   invalidation to privacy-toggle and account-deletion mutation paths.

9. **Certificate integration**: Decorate public verification and artifact-status queries with
   distributed mutex stampede protection. Add synchronous revocation invalidation.

10. **Admin integration**: Add user-scoped cached decorator services. Add synchronous role-revocation
    invalidation to admin account management mutations.

11. **Runtime config**: Replace `app-config.ts` local Map with shared cache. Preserve env override precedence.

12. **Rate limit migration**: Replace in-memory admin and course application limiters. Add contact
    submission and public scraping throttles.

13. **Observability**: Emit all `CacheHealthSignal` metrics (see data-model metric names table).
    Integrate with existing Sentry/telemetry where available. Add alert baseline thresholds
    documented in `quickstart.md`.

14. **Integration tests**: Multi-surface decorator behavior, cross-instance rate-limit consistency
    (using shared adapter fake), profile privacy invalidation, admin role revocation invalidation.

15. **Verification**: `pnpm run typecheck`, `pnpm run test`, focused domain/route tests.

---

## Testing Strategy

### Unit Tests

- Cache key builder produces stable, order-independent hashes: `{page:1, lang:'en'}` and
  `{lang:'en', page:1}` must produce the same hash.
- TTL jitter: for two entries written at the same second, their `freshUntil` timestamps must
  differ by up to `ttlJitterSeconds` — confirming mass-expiry staggering works correctly.
- Codec rejects unsupported `schemaVersion` values and returns `miss`.
- Codec rejects malformed envelopes and returns `miss` (never an unvalidated payload).
- Codec correctly round-trips ISO-string timestamps, rejects BigInt in payload, converts
  undefined to null, and rejects NaN/Infinity in numeric fields.
- Compressed entries (gzip prefix) decode to the same payload as uncompressed entries.
- Payload size check: entries exceeding `maxPayloadBytes` return `{ status: "bypassed" }` and
  emit `cache.set.bypass` — the value from `load()` is still returned to the caller.
- `getOrSet` returns `hit`, `miss`, `stale`, and `bypassed` states correctly.
- `getOrSet` does not cache thrown errors from `load()`.
- Tag invalidation deletes all indexed keys and tolerates missing keys without error.
- Tag invalidation is idempotent: calling twice with the same tags produces the same result.
- Upstash adapter maps Redis errors into controlled `CacheGetResult`/`CacheSetResult` error shapes.
- XFetch: with very small delta and early expiry, `recompute_now` fires with statistical probability.
- Mutex: second concurrent caller is deferred while lock holder holds `lockKey:__lock`.
- Circuit breaker opens after `failureThreshold` consecutive errors.
- Circuit breaker enters half-open after `recoveryWindowSeconds`.
- Distributed limiter returns `allowed`, `denied`, `remaining`, `resetAt`, and `retryAfterSeconds` correctly.
- Sliding window limiter does not allow 2× burst at window boundary (fixed window does, and that is expected for fail-open rules only).
- Domain decorators never cache private or personalized fields (assert no PII in stored envelope).
- Internal worker requests with valid HMAC bypass user-facing rate limits and apply internal rule.

### Chaos / Fault Injection Tests

Using the memory adapter configured to simulate Redis failures:

- **`SET` failure on write**: `getOrSet` must call `load()`, return the result to the caller, emit `cache.set.failure` metric, and not throw.
- **`SMEMBERS` returns partial result on invalidation**: `invalidateTags` must emit `failedKeys > 0`, return `ok: false`, and not throw.
- **GET timeout**: `getOrSet` must apply `fallbackMode` (call `load()` for `"source"`, serve stale for `"safe-stale"`, deny for `"strict-deny"`). Must emit `cache.get.error` metric.
- **Stampede mutex lock crash**: After lock TTL expires, a second caller must acquire the lock and recompute successfully without deadlock.
- **Circuit opens**: After `failureThreshold` consecutive GET errors, circuit transitions to `open`. Subsequent calls must not attempt Redis and must follow `fallbackMode`.
- **Circuit half-open probe success**: After `recoveryWindowSeconds`, one probe request succeeds, circuit closes, subsequent requests use Redis again.

### Integration Tests

- Public course list caches base DTO and merges subscription state separately after cache read.
- Admin course mutation (`course.updated`) invalidates public course tags; next read is a miss then re-populates.
- Opportunity detail serves safe stale data during simulated upstream 5xx failure.
- Public profile cache invalidates on privacy toggle; next read returns miss, not stale private data.
- **GDPR erasure**: `user.account_deleted` event invalidates profile, admin-user tags synchronously;
  subsequent requests for the deleted user's public profile and admin data return miss or 404.
- Certificate status invalidates on `certificate.revoked` synchronously; revoked state is immediately visible.
- Admin stats cache is only populated after admin authorization; non-admin requests cannot trigger a cache fill.
- **Admin role revocation**: After `admin.role_revoked` event, user-scoped admin cache tags are invalidated synchronously. Subsequent admin API calls by the revoked user hit source-of-truth (or return 403 at auth layer).
- **Read-your-writes**: After an admin mutation, the `sx-cache-bypass` cookie is set on the response;
  the next request from the same session bypasses the cache for the affected surface.
- Admin and course application rate limits remain shared across two limiter instances backed by the same in-memory store (verifying cross-instance consistency).
- Internal worker requests with valid HMAC header bypass user rate limits and hit the internal rule.

### Load Tests

Run against staging with real Redis before each high-traffic surface is enabled at 100%:

**Tool**: k6 or Artillery  
**Run duration**: 60 seconds per scenario  
**Warm-up**: 10 seconds before measuring

| Scenario | Concurrency | Success Criteria |
|---|---|---|
| Public course list | 500 VUs | p95 < 500ms, hit rate ≥ 70% after warm-up, error rate < 0.1% |
| Opportunity detail | 300 VUs | p95 < 700ms, hit rate ≥ 85%, no upstream 5xx cascade |
| Public profile reads | 200 VUs | p95 < 500ms, hit rate ≥ 60% |
| Admin stats (admin users) | 50 VUs | p95 < 500ms, no cross-user data leakage |
| Course catalog + Redis disabled | 200 VUs | p95 < 2000ms (DB-only baseline); circuit must NOT open |

**Key observations during load test**:
- Circuit breaker must NOT open under normal load (Redis should not be the bottleneck).
- Redis memory must stay within the estimated 87 MB + 20% headroom during sustained load.
- DB query rate during the load test (with cache ON) must be ≤30% of the DB-only baseline.
- Confirm no stampede burst at test start: first 10s miss spike should return to steady state
  within 15s (XFetch prevents multi-concurrent recomputes; jitter prevents mass-expiry spikes).

### Verification Commands

```powershell
pnpm run typecheck
pnpm run test
node --import tsx --test src/lib/cache/*.test.ts
node --import tsx --test src/lib/rate-limit/*.test.ts
node --import tsx --test src/domain/courses/**/*.test.ts
node --import tsx --test src/domain/certificates/**/*.test.ts
node --import tsx --test src/domain/admin/**/*.test.ts
node --import tsx --test src/app/api/**/*.test.ts
```

---

## Rollout Plan

All cache surfaces ship with `enabledByDefault: false`. Each step enables exactly one surface
or concern. Review hit rates, stale rates, latency, and invalidation failures before proceeding
to the next step.

1. **Ship infrastructure** — cache port, key builder, codec, circuit breaker, stampede helpers,
   metrics sink, memory adapter, Upstash adapter. All surface flags disabled. Zero behavioral change.

2. **Enable distributed rate limits for avatar uploads** — behavior already depends on Upstash.
   Migrate to the shared factory while preserving the existing response shape. Verify multi-instance
   consistency with the smoke test in `quickstart.md`.

3. **Enable admin and course application distributed limits** — replace in-memory Maps. Enable
   contact submission and public scraping throttles.

4. **Enable runtime config shared cache** — short TTL (60s), health logging enabled.
   Verify env override precedence takes effect before the cache read.

5. **Enable opportunity detail caching** — start at 10% canary (via feature flag percentage rollout
   if infrastructure supports it, otherwise 100%). Monitor Redis memory growth and upstream
   error rate. Verify safe-stale behavior during simulated upstream failure.

6. **Enable opportunity search caching** — apply cardinality controls before enabling.
   Monitor key count metric for the `opportunities:search` tag.

7. **Enable public course category/list/detail caching** — verify admin mutation invalidation
   smoke tests pass. Enable cache warming for top-N most requested course slugs.

8. **Enable public profile caching** — verify privacy-toggle invalidation end-to-end before enabling.

9. **Enable public certificate verification/status caching** — verify revocation invalidation
   end-to-end before enabling.

10. **Enable admin stats/report/list caching** — verify role-revocation invalidation before enabling.
    Admin-only load test to confirm authorization is not being bypassed.

11. **Tune TTLs** — after 72h of production data, review hit rates, stale-hit rates, invalidation
    failure rates, DB query reduction, and p99 latency. Extend TTLs only where invalidation
    correctness is confirmed.

### Cache Warming

For high-read surfaces (course list, course categories, opportunity detail), cold-cache bursts
after flag enable can spike DB load if traffic is high. Mitigate:

- Schedule warming **before peak traffic hours** (e.g., deploy at low-traffic time).
- Add a one-off warm-up script that pre-fetches the top-N most-requested cache keys
  (courses: all published courses; opportunities: top-100 most-viewed by id/lang combination)
  before enabling the surface flag.
- Monitor DB query rate before and after warming to confirm the burst is absorbed.

---

## Risk And Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Personalized course state leaks into public cache | Users see another user's enrollment/progress | Cache only base public DTOs; merge user state after cache read. Asserted in unit tests. |
| Profile privacy changes serve stale public data | Private profile remains publicly visible | Immediate-priority invalidation on privacy toggle and account deletion; short TTL (60s max). |
| Admin auth result gets cached | Unauthorized access risk | Cache only after authorization; never cache session/role decisions; user-scoped cache keys. |
| Admin role revocation not reflected in cache | Revoked admin sees cached data | Synchronous invalidation of user-scoped admin tags on `admin.role_revoked` event. |
| User exercises GDPR right to erasure | Deleted user data remains in cache | `user.account_deleted` compound event purges all user-tagged cache entries synchronously. |
| Redis outage breaks user journeys | Public pages or writes fail | Public reads fall back to source or safe stale; risky writes use explicit fail-closed policies. Circuit breaker prevents repeated Redis hammering. |
| Cache invalidation misses a mutation | Stale public/admin data | Atomic Lua SET+SADD prevents tag index orphans; bounded TTLs provide time-limited recovery; every invalidation path is integration-tested. |
| Stampede on popular expired key | DB spike on cache expiry | XFetch recomputes early probabilistically; mutex for privacy-sensitive surfaces prevents multiple simultaneous recomputes. |
| Mass simultaneous expiry (thundering herd) | DB overload spike when many entries expire at once | TTL jitter staggers expiry across the cached entry population per surface. |
| Tag index race (SET before SADD) | Orphaned key bypasses invalidation | Lua atomic script or MULTI/EXEC pipeline eliminates the race; orphaned entry worst-case bounded by `staleUntil` TTL. |
| Excessive cache key cardinality (search) | Redis memory growth; low hit rate | Opportunity search: 100-char query cap, character filtering, max 10,000 key count warning. |
| Redis memory exhaustion | noeviction triggers errors → circuit opens | `volatile-lru` eviction policy required; memory alert at 70%; estimated 87 MB baseline sized. |
| Large payload fills Redis disproportionately | Memory hotspot; slow serialization | `maxPayloadBytes` per surface; gzip compression for payloads > 1 KB. Admin reports: 512 KB cap. |
| Serialization edge cases (Date, BigInt, NaN) | Silent shape drift or TypeError | Codec serialization rules enforce ISO strings for dates, prohibit BigInt, convert undefined to null, reject NaN/Infinity. |
| Read-your-writes inconsistency after admin mutation | Admin sees their own stale data | `sx-cache-bypass` cookie set on mutation response; next request bypasses cache for affected surface. |
| Internal worker blocked by user-facing rate limits | Background jobs throttled | Internal HMAC exemption header bypasses user limits; internal worker rule (1000/min) prevents runaway. |
| Dependency version bump breaks tag atomicity | Lua eval API changes silently | Exact version pinning + full chaos test suite required before any `@upstash/redis` upgrade. |
| Clock skew between app instances | Freshness inconsistency | ±1s skew tolerance is acceptable given short TTLs; Redis `TIME` command fallback available if skew exceeds 5s. |
| Redis client initialized per request | Unnecessary HTTP overhead | Module-level singleton with 1 500ms read timeout + 500ms connect timeout. |
| Upstash free tier request-per-second limit | Rate limit errors under load | Document Pro/PAYG tier requirement in quickstart; circuit breaker absorbs transient bursts. |
| Cache bug invisible without observability | Stale data until user complaint | Structured metrics for all outcomes; alert thresholds in quickstart; operators can detect within 5 minutes. |
| Schema version mismatch during rolling deploy | Miss storm during deployment window | Expected and safe; old entries return miss to new readers; TTL cleanup removes old entries. |
| Redis key injection via raw params | Cache poisoning | Canonical hash includes all params; raw pagination/filter values never appended to keys directly. |

---

## Post-Design Constitution Check

| Principle | Status | Design Response |
|-----------|--------|-----------------|
| Proper Architecture & SOLID Patterns | PASS | Cache, rate-limit, circuit breaker, stampede, metrics, and domain decorators are separate responsibilities behind ports and factories. No leakage into routes or UI. |
| Uncompromising Code Quality & Type Safety | PASS | Typed DTOs, codecs with schema version management, required `negativeTtlSeconds`, canonical hash algorithm, no `any`. |
| Rigorous Testing Standards | PASS | Unit + integration + chaos tests covering all behavioral requirements, outage paths, and privacy invariants. |
| Premium User Experience Consistency | PASS | No visual changes; consistent Retry-After responses; stable fallback behavior across all surfaces. |
| Performance, Scalability & Maintainability | PASS | Shared Redis state supports horizontal scaling; module-level singleton prevents per-request overhead; surfaces enabled incrementally. |

---

## Complexity Tracking

No constitution violations. The new cache/rate-limit ports are justified because caching and
distributed coordination are cross-cutting concerns that must remain testable and isolated from
route handlers, UI, and domain business rules. The additional `cache-circuit-breaker.ts` and
`cache-stampede.ts` modules are justified because they encapsulate distinct failure-mode concerns
that would otherwise be inlined into the adapter, violating single responsibility.
