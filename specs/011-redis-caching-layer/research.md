# Research: Shared Redis Caching Layer

## Decision: Use existing Upstash Redis dependencies

**Rationale**: `@upstash/redis` and `@upstash/ratelimit` already exist in `package.json` and `src/lib/rate-limiter.ts` already uses them for avatar/profile limits. Reusing the installed provider avoids dependency churn and matches the serverless-friendly HTTP Redis model already present in the app.

**Alternatives considered**:

- Add `ioredis` or `redis`: rejected because it introduces a new network/client model and likely persistent connection concerns for serverless deployments.
- Use only Next.js data cache: rejected because it does not solve distributed rate limits, shared runtime config, or cross-instance operational state.
- Keep PostgreSQL-only counters: acceptable for durable email-specific controls, but not ideal for high-frequency public/admin limits and hot-read response caching.

## Decision: Hide Redis behind server-only ports

**Rationale**: ScholarX already uses domain factories, repositories, and infrastructure adapters. A `CachePort` and `DistributedRateLimiter` port preserve dependency inversion and prevent Redis SDK calls from spreading into pages, route handlers, or Client Components.

**Alternatives considered**:

- Import Upstash directly in every service: rejected because it couples business logic to infrastructure and makes fallback/testing inconsistent.
- Add a global cache singleton with untyped methods only: rejected because untyped JSON payloads would weaken data boundaries and make privacy mistakes easier.

## Decision: Cache normalized DTOs, not raw rows or UI props

**Rationale**: Existing code normalizes database and external payloads before UI consumption. Caching normalized, safe DTOs keeps public/private boundaries clear and avoids leaking database internals or raw upstream shapes.

**Alternatives considered**:

- Cache raw database rows: rejected because row shape may include fields that should not be public and ties cache entries to schema details.
- Cache rendered HTML: rejected because most target surfaces need API/page data reuse and personalized state merging.

## Decision: Use explicit tag invalidation plus bounded TTLs

**Rationale**: Course, profile, and certificate changes have known mutation boundaries. Tags make invalidation targeted, while TTLs provide recovery if an invalidation call is missed. Upstash does not provide native cache tags, so the adapter should maintain tag-to-key index sets.

**Alternatives considered**:

- TTL-only caching: rejected for privacy-sensitive profile changes, archive changes, and certificate revocation because stale data windows would be too risky.
- Global cache flush on every mutation: rejected because it destroys hit rate and couples unrelated surfaces.

## Decision: Keep public and personalized course data separate

**Rationale**: `NextCourseCatalogService` currently merges public course data with user-specific subscription/progress state. Cache only base public course DTOs and resolve per-user state after the cache read.

**Alternatives considered**:

- Cache per-user full course responses: rejected for high cardinality and privacy risk.
- Skip course caching entirely: rejected because public course catalog/detail reads are a high-value repeated-read path.

## Decision: Replace in-memory request limits with distributed limits

**Rationale**: `src/lib/admin/rate-limiter.ts` and course application submission helpers use process-local Maps. Those limits are inconsistent across multiple instances. Shared Redis counters solve horizontal scaling while matching the already installed Upstash rate-limit package.

**Alternatives considered**:

- Keep in-memory limits: rejected for production multi-instance deployments.
- Use database-backed limits everywhere: more durable but heavier for high-frequency request control; existing email service can keep database-specific counters until it needs migration behind the same port.

## Decision: Different fallback behavior by risk

**Rationale**: A public read can safely fall back to source-of-truth reads or stale public data. A write abuse limit should fail closed if the limiter cannot prove the request is allowed. Policies need this distinction per surface.

**Alternatives considered**:

- Always fail open: rejected because uploads, admin operations, contact submission, and applications can be abused.
- Always fail closed: rejected because a Redis outage would unnecessarily block public browsing.

## Decision: Start with short TTLs and feature flags

**Rationale**: The codebase has multiple mutation paths. Short TTLs and per-surface toggles let the team verify hit rate, invalidation correctness, and latency before extending cache duration.

**Alternatives considered**:

- Long TTLs from day one: rejected because stale data risk is higher during first rollout.
- Big-bang enablement: rejected because each surface has different privacy and freshness constraints.

## Decision: Observability is required for rollout

**Rationale**: Cache bugs are often invisible until stale data or outages appear. Metrics for hit, miss, stale hit, latency, invalidation failure, bypass, and rate-limit errors are necessary to verify success criteria.

**Alternatives considered**:

- Console logs only: rejected because they are hard to aggregate and cannot support alerting reliably.
- No metrics until after rollout: rejected because it prevents safe TTL tuning and incident detection.
