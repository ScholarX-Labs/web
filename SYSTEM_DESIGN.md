# 🧠 SYSTEM_DESIGN

## Overview
ScholarX is a full-stack platform for scholarship/course/opportunity discovery with AI-assisted search and executive analytics.  
The system is designed around reliability, clear domain boundaries, and trustworthy metrics.

## Design Goals
- Fast, intuitive discovery for learners
- Secure auth boundaries for public/auth/admin surfaces
- Reliable event tracking and KPI-aligned analytics
- Clear separation between UI, application logic, domain services, and data access
- Production readiness on Azure Container Apps

## High-Level Components
- Next.js App Router frontend + server runtime
- Auth layer (Better Auth)
- Route handlers / server actions
- Domain services + read-model builders
- PostgreSQL via Drizzle ORM
- PostHog ingestion via same-origin `/ingest/*`
- Internal executive analytics mirror

## Core Flows
1. Learner Discovery Flow
- User lands on public pages → navigates opportunities/courses → applies/saves opportunities.

2. AI Search Flow
- User submits query → API fetches ranked results → analytics events emitted (client + mirrored where applicable).

3. Executive Analytics Flow
- Tracked events → privacy/schemas/dispatch → internal mirror for KPI-critical events → read models for dashboard APIs.

## Reliability Patterns
- Fail-open analytics dispatch (UX never blocked by telemetry failures)
- Event schema validation + sanitization before writes
- Environment validation gates
- Build-time public env wiring for frontend analytics

## Scalability Considerations
- Domain/read-model separation reduces coupling
- Selective mirroring avoids overloading executive store
- Cache/rate-limit infrastructure is pluggable (Redis/Azure Redis)

