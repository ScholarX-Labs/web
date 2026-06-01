# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager**: pnpm 10.33.0

```bash
pnpm dev          # Start dev server (validates env first)
pnpm build        # Validate env + Next.js build
pnpm lint         # ESLint (Next.js + TypeScript rules)
pnpm typecheck    # TypeScript strict check (no emit)
pnpm test         # Unit/integration tests (Node test runner + tsx)
pnpm test:api     # API route handler tests only
pnpm db:generate  # Generate Drizzle migration files
pnpm db:migrate   # Run pending migrations
pnpm db:push      # Push schema changes without migration files
```

Run a single test file:
```bash
node --import tsx --test src/path/to/file.test.ts
```

E2E tests (Playwright):
```bash
node --import tsx --test tests/e2e/**/*.spec.ts
```

## Architecture

**Stack**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Drizzle ORM + PostgreSQL, Better Auth, Redis (optional), PostHog, Sentry.

### Layer Structure

```
src/app/         → Routes, layouts, API handlers (Next.js App Router)
src/domain/      → Business logic services (courses, certificates, analytics, email)
src/lib/         → Shared infrastructure: cache, rate-limiting, AI search, query keys, validators
src/components/  → React components (ui/ = shadcn/Radix primitives)
src/db/schema/   → Drizzle table definitions
src/config/      → Environment validation (env.ts) and TanStack Query key factory
src/providers/   → React context providers (QueryClient, PostHog, URL sync)
src/store/       → Zustand stores
src/hooks/       → Custom React hooks
```

Data flows top-down: **route handler → domain service → repository → database**. Domain services in `src/domain/` own business rules and never import from `src/app/`. API routes in `src/app/api/` orchestrate but do not contain business logic.

### Route Groups

- `(platform)/` — public user-facing pages (courses, opportunities, certificates)
- `admin/` — admin dashboard and management pages
- `api/` — REST endpoints including `api/auth/[...all]` (Better Auth) and `api/analytics/events` (internal mirror)
- `ai-search/` — AI-powered search UI
- `auth/` — sign-in / sign-up pages
- `ingest/` — PostHog analytics proxy (rewrites configured in `next.config.ts`)

### Key Conventions

**Environment validation** runs before dev and build via `validate:env` (see `src/config/env.ts`). All env vars must be declared there with Zod schemas.

**Analytics**: PostHog events are dispatched via `src/lib/telemetry/`. Privacy filtering removes sensitive keys before dispatch. Analytics failures must never block user journeys (fail-open pattern).

**Caching**: A Redis abstraction lives in `src/lib/cache/`. It is optional — if Redis is not configured the app runs without distributed cache.

**State management**: TanStack React Query for remote/server state; Zustand for local UI state. Query keys are centralized in `src/config/query-keys.ts`.

**Forms**: React Hook Form + Zod. Validators live in `src/lib/validators/`.

**Storage**: AWS S3-compatible (Cloudflare R2) via `@aws-sdk/client-s3`, used primarily for certificate artifacts.

**Auth**: Better Auth with Drizzle adapter. Session data is stored in the database.

### Next.js Configuration Notes

- Output is `standalone` (Docker/container deployment).
- `/ingest/*` rewrites proxy analytics to PostHog.
- Sentry source map upload is optional (controlled via env).
- Image remote patterns allow Unsplash, Placehold, and Cloudinary domains.

### Reference Documents

Detailed specs live in the repo:
- `ARCHITECTURE.md` — layered architecture overview
- `DATABASE_SCHEMA.md` — Drizzle schema documentation
- `API_DOCUMENTATION.md` — API endpoint reference
- `TESTING.md` — test strategy and coverage expectations
- `SECURITY.md` — security posture and controls
- `DEPLOYMENT.md` — deployment procedures
