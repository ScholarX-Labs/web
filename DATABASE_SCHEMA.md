# 🗄️ DATABASE_SCHEMA

## Primary Database
- PostgreSQL
- ORM: Drizzle

## Key Schema Areas

1. Auth/User
- User identity and session-related tables managed by Better Auth integration

2. Product Domain
- Courses, lessons, opportunities, learner progress, related operational entities

3. Executive Analytics
- `executive.analytics_events` (typed event stream for mirrored analytics)
- Freshness/action/governance tables for executive read models

## Analytics Event Shape (Executive Mirror)
- `event_type`
- `occurred_at`
- `user_id` (nullable)
- `session_id_hash` (nullable)
- `entity_type`, `entity_id` (nullable)
- attribution fields (`source`, `medium`, `campaign`)
- `device_type`
- `metadata` JSONB

## Migration Workflow
- Generate: `pnpm db:generate`
- Apply: `pnpm db:migrate`
- Push (non-prod): `pnpm db:push`

## Data Integrity Notes
- Event types are strongly typed in schema contracts
- Nullable fields used intentionally for privacy-safe, resilient ingestion
- Governance/state tables support operational read models

