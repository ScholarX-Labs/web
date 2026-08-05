# Implementation Plan: Auth Schema Migration to app_auth

**Branch**: `020-auth-schema-migration` | **Date**: 2026-08-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/020-auth-schema-migration/spec.md`

## Summary

The platform's custom authentication data lives in a PostgreSQL schema named `auth`, which collides with a namespace reserved by the Supabase hosting provider. The database specialist has already renamed the schema to `app_auth` in the shared database and migrated the data. This feature makes the codebase consistent with that state and removes the recurring cost of schema renames:

1. **Centralize namespace resolution** — introduce `src/db/schema/namespaces.ts` as the single source of truth for every PostgreSQL schema name (`app_auth`, `public`, `courses`, `certificates`, `email`, `executive`). All `pgSchema()` instances, Drizzle config, raw SQL, and tooling feed from it, so a future rename is a one-line change.
2. **Point all references to `app_auth`** — schema definitions, raw SQL in the executive domain, migration SQL + snapshots, and diagnostic scripts.
3. **Rebase the Drizzle migration chain** — replace the historical `auth`-schema migration history with a clean baseline that reproduces `app_auth` on fresh environments, matching the already-renamed shared database.
4. **Deliver the ORM/migration-tooling analysis** (documentation only, no code/database changes) comparing the current approach with alternatives such as Prisma, per FR-014/FR-015.

Runtime behavior does not change; no UI or user-facing behavior changes. Applied during a short maintenance window; the dump is the rollback safety net.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node 20, ESM  
**Primary Dependencies**: Next.js 16, Drizzle ORM 0.45 + drizzle-kit 0.31, Better Auth 1.5 + @better-auth/drizzle-adapter, `pg` 8, `tsx`  
**Storage**: PostgreSQL on Supabase. Schemas: `app_auth` (target), `public` (leaderboard tables), `courses`, `certificates`, `email`, `executive`. Port 6543 = PgBouncer pooling; direct port 5432 for DDL/migrations.  
**Testing**: `node --import tsx --test` (unit + integration), Playwright (e2e), `pnpm lint`, `pnpm typecheck`  
**Target Platform**: Next.js App Router server (deployed via opennextjs-cloudflare Worker and Azure Container Apps)  
**Project Type**: Web application  
**Performance Goals**: No change to runtime query paths or performance; verification is regression-based  
**Constraints**: No new runtime dependencies (ORM analysis is doc-only); DB credentials only via env; migration must be data-loss-free and reversible via the dump; DDL must run over a direct (non-pooled) connection  
**Scale/Scope**: Production multi-schema Postgres; ~25 migration files; ~50 schema-qualified references to update across schema definitions, raw SQL, scripts, and docs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Rationale |
|-----------|---------|-----------|
| I. SOLID / Architecture | PASS | `namespaces.ts` gives Single Responsibility + Open/Closed for schema naming; raw SQL resolves the schema via the centralized source instead of magic strings |
| II. Type Safety | PASS | `as const` typed schema map; strict TS; no `any` |
| III. Testing | PASS | New unit tests for the namespace module and executive query resolution; full suite + lint + typecheck gated in CI |
| IV. UX Consistency | N/A | No user-facing change |
| V. Performance / Maintainability | PASS | Single-source namespaces materially improves maintainability; zero performance impact |
| Production Grade | PASS | CI runs typecheck, lint, tests; observability untouched |
| AGENTS.md Non-Negotiables | PASS | No new dependency; centralization is the explicitly requested scope, not an opportunistic rewrite |

## Project Structure

### Documentation (this feature)

```text
specs/020-auth-schema-migration/
├── plan.md              # This file
├── research.md          # Phase 0: inventory + design decisions (incl. migration rebase strategy)
├── data-model.md        # Phase 1: schema rename data model + centralized namespace model
├── quickstart.md        # Phase 1: verification / rollout runbook
├── contracts/
│   └── db-namespace.md  # Contract for the canonical namespace module
├── orm-analysis.md      # FR-014 deliverable: migration-tooling analysis (created during implementation)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/db/
├── schema/
│   ├── namespaces.ts            # NEW: canonical DB_SCHEMAS map + typed schema instances (single source of truth)
│   ├── auth-schema.ts           # EDIT: import authSchema from namespaces.ts (app_auth)
│   ├── admin-db.schema.ts       # EDIT: import authSchema + coursesSchema from namespaces.ts
│   ├── courses-db.schema.ts     # EDIT: import coursesSchema from namespaces.ts
│   ├── certificates-db.schema.ts# EDIT: import certificatesSchema from namespaces.ts
│   ├── email-db.schema.ts       # EDIT: import emailSchema from namespaces.ts
│   ├── executive-analytics.schema.ts # EDIT: import executiveSchema from namespaces.ts
│   └── (leaderboard.ts)         # unchanged: public schema
src/domain/executive/
├── infrastructure/db/executive.repository.ts  # EDIT: raw SQL resolves auth schema via sql.identifier(namespaces)
└── application/metric-definition.registry.ts  # EDIT: description strings updated to app_auth
src/lib/auth.ts                  # NO CHANGE (schema object import follows namespaces automatically)

scripts/
├── baseline-drizzle-migrations.mjs  # EDIT: auth legacy-schema check reads AUTH_SCHEMA
├── inspect-db.js                    # EDIT: auth schema literals read AUTH_SCHEMA
├── migrations/                      # EDIT: auth.* -> app_auth.* (4 SQL files)
└── fix-auth-schema.js               # NO CHANGE (operates on auth-schema.ts content generically)

drizzle/
├── *.sql                           # EDIT: rebase chain to app_auth (regenerated baseline 0000 + patched history)
└── meta/*.json                     # EDIT: snapshots regenerated to app_auth
drizzle.config.ts                   # EDIT: schemaFilter derived from DB_SCHEMAS
docs/frontend-nextjs-schema-auth-guide.md  # EDIT: namespace guidance updated to app_auth
AGENTS.md                           # EDIT: SPECKIT markers add 020 plan
```

**Structure Decision**: Follows the existing `src/db/schema/` layout. The only new module is the canonical `namespaces.ts`, which is a light typed facade over `pgSchema()` — no new architectural layer. Raw SQL stays in the executive repository (data normalization close to data access) but resolves schema names from the canonical source instead of literals.

## Complexity Tracking

> Filled because Constitution gate II/AGENTS "small patches" is deliberately exceeded for the migration history.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Rebase/edit ~25 historical migration files + snapshots | The shared DB is already renamed; fresh environments must reproduce `app_auth` or every new deploy re-creates the colliding `auth` schema | Patching only current code leaves migration history pointing at the old schema name, guaranteeing the next `db:migrate` on a fresh environment fails |
| Centralize all schema names (not just auth) | User requirement (FR-013/SC-007): next rename must be one-line; scoped to a thin facade, not a new layer | Only renaming `auth` leaves 5 other schema names scattered, keeping the failure mode alive |
| Add a written ORM analysis deliverable | FR-014/FR-015; decision-support for migration-history pain | Skipping it leaves the recurring "push schema to make it work" issue unexamined |
