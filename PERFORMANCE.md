# Performance

## Caching
- Redis cache with stale‑while‑revalidate behavior reduces latency on read-heavy endpoints.
- Cache keys are normalized to keep results deterministic.

## Rate limiting
- Redis ZSET sliding‑window rate limiting protects upstream services and keeps latency stable.

## Background processing
- Certificate rendering runs in a worker to keep user-facing requests fast.
- Outbox + queueing ensures reliable retries for long-running jobs.

## Observability
- Cache metrics and analytics latency tracking are used to detect regressions early.
