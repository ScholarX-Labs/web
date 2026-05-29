# ScholarX Case Study

## What problem does ScholarX solve?
ScholarX addresses the fragmented and often inaccessible landscape of scholarships, courses, mentorship, and early‑career opportunities. Students and young professionals need a single, trusted place to discover opportunities, enroll in programs, and receive verifiable proof of achievement.

## Why did I build it?
I built ScholarX to remove barriers to upward mobility and empower students globally with accessible education, mentorship, and curated opportunities.

## What users is it for?
- Students and young professionals searching for scholarships, courses, and mentorship.
- Partner organizations delivering programs and issuing certificates.
- Admin and executive teams who need reliable analytics and impact reporting.

## What technical challenges appeared?
- Integrating an external AI search API while keeping latency predictable and results reliable.
- Implementing caching, stale‑while‑revalidate behavior, and rate limiting to protect upstream services.
- Designing an idempotent certificate pipeline with background PDF rendering and email delivery.
- Enforcing analytics governance to avoid raw PII in event payloads.

## What architecture did I choose?
ScholarX is a Next.js 16 App Router application with API routes and a domain service layer. It uses PostgreSQL (Drizzle ORM) for data, Redis for caching and rate limiting, Azure Service Bus for queueing, and a worker service for certificate generation. Observability is provided by PostHog and Sentry, and the platform is deployed with Docker on Azure Container Apps.

## What alternatives did I reject?
- Building an in‑house search index instead of using an external search API.
- Client‑only caching of search results due to privacy and invalidation risks.
- Emitting raw PII into analytics events.
- Removing rate limits for “better UX” at the expense of reliability.
- Generating certificates inline instead of using an outbox + worker pipeline.

## What results were achieved?
- 15,000+ students attended programs, with 96 partner organizations and 38 events delivered.
- Faster AI search responses with predictable relevance ordering.
- More reliable certificate delivery and verification.
- Clearer impact reporting through executive dashboards.

## What would I improve next?
- Add personalized ranking signals for AI search.
- Ship certificate template v2 with richer metadata.
- Expand opportunity support beyond English and Arabic.
- Consolidate executive KPIs with anomaly detection.
