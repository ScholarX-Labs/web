# Architecture

## High-level components
- **Web app:** Next.js App Router UI + server components.
- **API layer:** Next.js API routes that validate inputs and call domain services.
- **Domain services:** Shared business logic for search, courses, certificates, and analytics.
- **Worker:** Background service for certificate rendering and email delivery.
- **Data & infra:** PostgreSQL, Redis, Azure Service Bus, and external providers.

## Repository layout
- `src/app` — UI routes and API route handlers.
- `src/domain` — domain services and infrastructure adapters.
- `src/db/schema` — Drizzle ORM schema definitions.
- `src/worker` — certificate worker pipeline.
- `drizzle/` — generated migrations.
- `docs/` and `specs/` — implementation guides and formal specs.

## Deployment architecture
ScholarX is deployed to Azure Container Apps. The web app and worker are built as separate Docker images and deployed via GitHub Actions for consistent releases.

## Architecture diagram
```mermaid
flowchart LR
  Browser[Users + Browsers]
  subgraph Web["ScholarX Web (Next.js App Router)"]
    UI[UI + Server Components]
    API[Next.js API Routes]
    Domain[Domain Services]
  end
  subgraph Data["Data & Infra"]
    Postgres[(PostgreSQL)]
    Redis[(Azure Cache for Redis)]
    ServiceBus[(Azure Service Bus)]
  end
  SearchAPI[ScholarX Search API]
  PostHog[PostHog Analytics]
  Sentry[Sentry]
  Worker[Certificate Worker]
  Email[Email Providers]

  Browser --> UI --> API --> Domain
  Domain --> Postgres
  Domain --> Redis
  API --> SearchAPI
  API --> PostHog
  API --> Sentry
  Domain --> ServiceBus --> Worker --> Email
```
