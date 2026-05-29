# System Design

## Overview
ScholarX is a Next.js 16 App Router platform that combines UI, API routes, and a domain services layer. It relies on PostgreSQL for persistence, Redis for caching and rate limiting, Azure Service Bus for queueing, and a background worker for certificate generation and email delivery.

## Core flows
### AI search
1. `GET /api/opportunities/search` receives a query from the UI.
2. The domain layer calls the external search API.
3. Results are normalized, ranked, cached, and returned with deterministic ordering.

### Certificate issuance
1. Domain service writes the certificate record and outbox entry.
2. Azure Service Bus queues the job for the worker.
3. The worker renders the PDF and triggers email delivery.

### Executive analytics
1. Events flow through a registry with KPI mappings.
2. Aggregations and heatmap bucketing feed executive dashboards.

## Reliability patterns
- Redis cache with stale‑while‑revalidate behavior for read-heavy endpoints.
- Redis ZSET sliding‑window rate limiting for public endpoints.
- Outbox + worker pipeline for long‑running jobs.

## Observability
- PostHog for product analytics.
- Sentry for error and performance monitoring.
