# Implementation Plan: Auth Schema Migration to `app_auth`

**Branch**: `020-auth-schema-migration` | **Date**: 2026-08-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/020-auth-schema-migration/spec.md`
**Review**: Principal SWE reviewed 2026-08-05 — all critical findings (F-01 through F-04) resolved in this plan.

---

## Summary

The platform's custom authentication data lives in a PostgreSQL schema named `auth`, which collides with a namespace reserved by the Supabase hosting provider. The database specialist has already renamed the schema to `app_auth` in the shared database. This feature makes the codebase, tooling, migrations, and documentation consistent with that state — permanently eliminating the recurring cost of schema collisions.

Four pillars of work:

1. **Centralize namespace resolution** — introduce `src/db/schema/namespaces.ts` as the single source of truth for every PostgreSQL schema name. All `pgSchema()` instances, Drizzle config, raw SQL, and tooling are derived from it. A future rename is a one-line change.
2. **Point all references to `app_auth`** — schema definitions, raw SQL in the executive domain, migration SQL + snapshots, diagnostic scripts, and all documentation.
3. **Rebase the Drizzle migration chain** — replace historical `auth`-schema migration history with an idempotent clean baseline that safely reproduces `app_auth` on both fresh and already-renamed environments.
4. **Deliver the ORM/migration-tooling analysis** — documentation only (no code/database changes), per FR-014/FR-015.
5. **Automate schema-literal enforcement** — encode the namespace audit as a CI script so violations are caught on every PR, not just at cutover.
6. **Harden the cutover** — add a startup canary, a full cutover protocol, and a cross-repo consumer gate to the runbook.

Runtime behavior does not change. No UI or user-facing behavior changes. Applied during a short maintenance window; the dump is the rollback safety net.

---

## Technical Context

| Attribute | Value |
|-----------|-------|
| Language / Version | TypeScript 5.x (strict), Node 20, ESM |
| Primary Dependencies | Next.js 16, Drizzle ORM 0.45 + drizzle-kit 0.31, Better Auth 1.5 + @better-auth/drizzle-adapter, `pg` 8, `tsx` |
| Storage | PostgreSQL on Supabase. Schemas: `app_auth` (target), `public` (leaderboard), `courses`, `certificates`, `email`, `executive`. Port 6543 = PgBouncer (runtime only); port 5432 = direct (DDL/migrations) |
| Testing | `node --import tsx --test` (unit + integration), Playwright (e2e), `pnpm lint`, `pnpm typecheck` |
| Target Platform | Next.js App Router (deployed via opennextjs-cloudflare Worker + Azure Container Apps) |
| Performance Goals | No change to runtime query paths; verification is regression-based |
| Constraints | No new runtime dependencies; DB credentials only via env; migration must be data-loss-free and reversible via dump; DDL must run over a direct (non-pooled) connection |
| Scale / Scope | Production multi-schema Postgres; ~25 migration files; ~50 schema-qualified references across schema definitions, raw SQL, scripts, and docs |

---

## Design Principles & Patterns Applied

This section makes the architectural intent explicit and traceable.

### SOLID

| Principle | How This Plan Satisfies It |
|-----------|---------------------------|
| **Single Responsibility (SRP)** | `namespaces.ts` owns *only* schema-name resolution. Every other schema module owns only its own table definitions. `fix-auth-schema.js` is retired — its responsibility is absorbed by the canonical source, eliminating the dual-write concern. |
| **Open/Closed (OCP)** | `DB_SCHEMAS` is `as const`. Adding a new schema is an additive one-line change to the map. `drizzle.config.ts` derives `schemaFilter` via `Object.values(DB_SCHEMAS)` — consumers never need manual updates when a schema is added. |
| **Liskov Substitution (LSP)** | Not applicable (no class hierarchy). |
| **Interface Segregation (ISP)** | `namespaces.ts` is a pure-constant leaf: it imports nothing from `src/db/`. Consumers import only the instances they need. `import/no-cycle` ESLint rule enforces the leaf invariant, preventing the module from becoming a circular import hub. |
| **Dependency Inversion (DIP)** | Schema-definition modules depend on the `DB_SCHEMAS` abstraction (the logical key), not the physical string `"app_auth"`. The executive repository depends on `DB_SCHEMAS.auth`, not on a magic literal. Neither layer depends on the other's implementation. |

### Design Patterns

| Pattern | Applied Where | Rationale |
|---------|--------------|-----------|
| **Centralized Configuration (SSOT)** | `DB_SCHEMAS as const` in `namespaces.ts` | Eliminates the root cause of the original incident: scattered schema-name literals. All consumers derive from one place. |
| **Facade** | `namespaces.ts` wraps `pgSchema()` calls | Consumers receive a stable, typed `PgSchema` object without knowing the Drizzle call. The wrapping is zero-cost (plain constants). |
| **Strategy** | Migration rebase approach (§ Migration Strategy) | Two strategies evaluated — regenerate-clean-baseline vs. mechanical find-replace. The plan commits to the superior strategy with a documented fallback. |
| **Guard Clause / Idempotency Guard** | `CREATE SCHEMA IF NOT EXISTS` in regenerated baseline | The migration baseline must be safe to run against an environment where `app_auth` already exists (i.e., a dump-restored DB). Bare `CREATE SCHEMA` fails silently on conflicts; `IF NOT EXISTS` makes the migration idempotent. |
| **Canary / Health Probe** | `SELECT 1 FROM app_auth.user LIMIT 1` startup check | Converts a 30-day passive log watch into an immediate, pre-traffic signal. Fail-fast before real user requests reach a broken schema reference. |
| **Verification as Code** | `pnpm audit:schema-literals` CI script | Encodes the schema-literal grep audit as an automated, PR-gated check. Replaces the manual "check before cutover" with a lint-level enforcement that runs on every commit. |
| **Chain of Responsibility** | Cutover gate checklist (§ Cutover Protocol) | Each gate must pass before the next begins: consumer audit → maintenance announcement → migration apply → canary → smoke tests → all-clear. Any gate failure triggers the rollback path without ambiguity. |

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after principal SWE review.*

| Principle | Verdict | Rationale |
|-----------|---------|-----------|
| I. SOLID / Architecture | ✅ PASS | All five SOLID principles documented and enforced above; `import/no-cycle` added as structural guard |
| II. Type Safety | ✅ PASS | `as const` typed schema map; `DbSchemaName` type; `sql.identifier()` for raw SQL; strict TS; no `any` |
| III. Testing | ✅ PASS | Unit tests for namespace module + executive query resolution; `pnpm audit:schema-literals` in CI; full suite + lint + typecheck gated |
| IV. UX Consistency | N/A | No user-facing change |
| V. Performance / Maintainability | ✅ PASS | Zero runtime overhead (constants); single-source namespaces materially reduces future maintenance cost; automated audit enforces ongoing compliance |
| Production Grade | ✅ PASS | Idempotent migration baseline; startup canary; structured cutover protocol; rollback SLA validated |
| AGENTS.md Non-Negotiables | ✅ PASS | No new dependency; `fix-auth-schema.js` retired rather than worked around; changes stay within the smallest meaningful ownership boundary |

---

## Project Structure

### Documentation (this feature)

```text
specs/020-auth-schema-migration/
├── plan.md              ← This file (world-class edition)
├── research.md          ← Phase 0: inventory + design decisions + migration rebase strategy
├── data-model.md        ← Phase 1: schema rename model + centralized namespace design
├── quickstart.md        ← Phase 1: verification runbook + full cutover protocol
├── contracts/
│   └── db-namespace.md  ← Contract: canonical namespace module (updated: Object.values derivation)
├── checklists/
│   └── requirements.md  ← Updated: orm-analysis.md added as DoD gate
├── orm-analysis.md      ← FR-014 deliverable (created during implementation — required DoD gate)
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code Changes

```text
src/db/
└── schema/
    ├── namespaces.ts                 [NEW]  Canonical DB_SCHEMAS map + typed pgSchema() instances.
    │                                        Leaf module: imports only from drizzle-orm/pg-core.
    │                                        import/no-cycle enforced.
    ├── auth-schema.ts                [EDIT] Remove pgSchema("auth") literal. Import authSchema
    │                                        from namespaces.ts. Remove all [AUTO-FIXED] banner
    │                                        comments (source of truth is now namespaces, not the script).
    ├── admin-db.schema.ts            [EDIT] Import authSchema + coursesSchema from namespaces.ts.
    ├── courses-db.schema.ts          [EDIT] Import coursesSchema from namespaces.ts.
    ├── certificates-db.schema.ts     [EDIT] Import certificatesSchema from namespaces.ts.
    ├── email-db.schema.ts            [EDIT] Import emailSchema from namespaces.ts.
    ├── executive-analytics.schema.ts [EDIT] Import executiveSchema from namespaces.ts.
    └── leaderboard.ts                [—]    Unchanged (public schema, no pgSchema() call needed).

src/domain/executive/
├── infrastructure/db/
│   └── executive.repository.ts      [EDIT] Replace auth.user literals with
│                                           sql.identifier(DB_SCHEMAS.auth) + ".user"
│                                           in all 7 affected query sites (lines ~343, 382,
│                                           426, 445, 900, 989, 1258 per research.md §2).
└── application/
    └── metric-definition.registry.ts [EDIT] Update description strings: auth → app_auth.

src/lib/
└── auth.ts                           [—]    No change. Follows namespaces.ts automatically via
                                             the schema-definition modules it imports.

scripts/
├── audit-schema-literals.mjs        [NEW]  CI script: grep src/, drizzle/, scripts/, docs/ for
│                                           prohibited literals (pgSchema("auth"), "auth"., etc.).
│                                           Exits non-zero if any match found outside the allowlist.
│                                           Registered as pnpm audit:schema-literals.
├── baseline-drizzle-migrations.mjs  [EDIT] Legacy-schema check reads process.env.AUTH_SCHEMA ?? "app_auth".
├── inspect-db.js                    [EDIT] Auth schema literals → process.env.AUTH_SCHEMA ?? "app_auth".
├── migrations/                      [EDIT] auth.* → app_auth.* in all 4 one-shot SQL utilities.
└── fix-auth-schema.js               [DELETE] Retired. Its role (normalising auth-schema.ts) is
                                              superseded by namespaces.ts as the canonical source.
                                              Removing eliminates dual-write confusion and the
                                              [AUTO-FIXED] banner clutter in auth-schema.ts.

drizzle/
├── 0000_*.sql                       [REGENERATE] New idempotent baseline. MUST use:
│                                                 CREATE SCHEMA IF NOT EXISTS "app_auth";
│                                                 CREATE TABLE IF NOT EXISTS "app_auth"."user" (…);
│                                                 … (all CREATE statements use IF NOT EXISTS)
│                                                 This makes the migration safe on both fresh
│                                                 environments AND dump-restored DBs where
│                                                 app_auth already exists.
├── 0001–0024_*.sql                  [EDIT/REGENERATE] auth.* → app_auth.* per regenerated history.
└── meta/*.json                      [REGENERATE] Snapshots regenerated; table keys updated from
                                                  "auth.user" → "app_auth.user" etc.

drizzle.config.ts                    [EDIT] schemaFilter derived automatically:
                                            schemaFilter: [...Object.values(DB_SCHEMAS), "public"]
                                            NOT a manually maintained list.

docs/
└── frontend-nextjs-schema-auth-guide.md [EDIT] Namespace guidance updated to app_auth.
                                                 Links to contracts/db-namespace.md.

AGENTS.md                            [EDIT] SPECKIT markers: add specs/020-auth-schema-migration/plan.md.

.eslintrc / eslint.config.*          [EDIT] Add import/no-cycle rule scoped to src/db/schema/
                                            to enforce namespaces.ts leaf invariant.

package.json                         [EDIT] Add script: "audit:schema-literals": "node --import tsx
                                            scripts/audit-schema-literals.mjs"
```

**Structure Decision**: Follows the existing `src/db/schema/` layout. `namespaces.ts` is a pure leaf constant module — no new architectural layer. Raw SQL stays in the executive repository (data normalization close to data access) but resolves schema names from the canonical source via `sql.identifier()`. `fix-auth-schema.js` is retired, not preserved in a `NO CHANGE` limbo; its responsibility is absorbed by `namespaces.ts`.

---

## Migration Strategy

### Chosen Path: Regenerate Clean Idempotent Baseline

Work against a scratch DB restored from the provided dump (which already contains the renamed `app_auth`). After centralizing schema definitions:

1. Run `drizzle-kit generate` against the scratch DB to produce a fresh `0000` snapshot reflecting the entire current schema under `app_auth` (+ `public` leaderboard tables).
2. **All `CREATE` statements in the new `0000` MUST use `IF NOT EXISTS` guards.** This is non-negotiable: `db:migrate` will run against the dump-restored shared DB where `app_auth` already exists. A bare `CREATE SCHEMA "app_auth"` will fail.
3. Reset `drizzle/meta/_journal.json` to start from the new `0000`.
4. Update `scripts/baseline-drizzle-migrations.mjs` defaults (`DEFAULT_BASELINE_THROUGH`) and legacy-schema detection.
5. Verify on a **second** fresh restore: `db:migrate` runs clean, `drizzle-kit generate` shows zero drift (empty diff).

### Why Regenerate Over Mechanical Find-Replace

Hand-editing ~54 statements across applied migrations invalidates stored journal hashes, creates drift risk, and is exactly the failure mode that required "push schema to make it work" in the past. A regenerated baseline is the production-grade fix: fresh environments reproduce `app_auth`, and the shared DB (already renamed) is never touched by migration code.

### Fallback (Blocked Scratch DB Only)

Mechanical `"auth".` → `"app_auth".` and `CREATE SCHEMA "auth"` → `CREATE SCHEMA IF NOT EXISTS "app_auth"` across `drizzle/*.sql` + snapshots, with careful hash/journal reconciliation. `IF NOT EXISTS` guard is still mandatory. Higher drift risk; only if the scratch-DB approach is blocked.

---

## Detailed Technical Decisions

### 1. `namespaces.ts` — Canonical Schema Map

```ts
// src/db/schema/namespaces.ts
// Leaf module. MUST NOT import from any other src/db/ module.
import { pgSchema } from "drizzle-orm/pg-core";

export const DB_SCHEMAS = {
  auth:         "app_auth",
  courses:      "courses",
  certificates: "certificates",
  email:        "email",
  executive:    "executive",
} as const;

export type DbSchemaName = (typeof DB_SCHEMAS)[keyof typeof DB_SCHEMAS];

export const authSchema         = pgSchema(DB_SCHEMAS.auth);
export const coursesSchema      = pgSchema(DB_SCHEMAS.courses);
export const certificatesSchema = pgSchema(DB_SCHEMAS.certificates);
export const emailSchema        = pgSchema(DB_SCHEMAS.email);
export const executiveSchema    = pgSchema(DB_SCHEMAS.executive);
```

`public` is not declared; leaderboard tables use the default schema (`no pgSchema()` call needed). The `as const` assertion narrows the value types to string literals, satisfying strict TypeScript and enabling exhaustive type checks downstream.

### 2. `drizzle.config.ts` — Auto-Derived `schemaFilter`

```ts
// drizzle.config.ts
import { DB_SCHEMAS } from "@/db/schema/namespaces";

export default defineConfig({
  // …
  schemaFilter: [...Object.values(DB_SCHEMAS), "public"],
  // Object.values(DB_SCHEMAS) = ["app_auth","courses","certificates","email","executive"]
  // Adding a new schema to DB_SCHEMAS automatically includes it here — no manual update.
});
```

**Why `Object.values`**: Manually listing schemas in `schemaFilter` violates the Open/Closed Principle — every new schema requires two edits (map + filter list). `Object.values` makes the derivation automatic and the OCP is satisfied.

### 3. Raw SQL — `sql.identifier()` in Executive Repository

```ts
// executive.repository.ts (7 affected sites per research.md §2)
import { sql } from "drizzle-orm";
import { DB_SCHEMAS } from "@/db/schema/namespaces";

// Before:
// sql`... auth.user ...`

// After:
const authSchemaId = sql.identifier(DB_SCHEMAS.auth); // "app_auth"
// Usage: sql`... ${authSchemaId}.user ...`
```

`sql.identifier()` is the Drizzle-idiomatic, injection-safe way to interpolate a schema identifier. It wraps the value in double-quotes and escapes it. The schema name comes from the typed constant — no magic string, no injection surface.

### 4. Node Scripts — Env-with-Default

```js
// For .js/.mjs scripts that cannot import TS modules:
const AUTH_SCHEMA = process.env.AUTH_SCHEMA ?? "app_auth";
```

Env-with-default satisfies: (a) the default is the correct production value (`app_auth`), (b) override is possible in dev/test without a code change, (c) no hardcoded `"auth"` literal, (d) consistent with the existing env-driven tooling pattern.

### 5. `audit-schema-literals.mjs` — Verification as Code

```mjs
// scripts/audit-schema-literals.mjs
// Run via: pnpm audit:schema-literals
// CI: added to pnpm lint pipeline.
// Prohibited patterns (outside allowlist):
//   - pgSchema("auth")
//   - "auth".
//   - from auth.
//   - join auth.
//   - 'auth'
// Allowlist: drizzle/meta/ snapshots (historical), research.md (quoted examples).
// Exit code: 0 = clean, 1 = violations found (with file + line output).
```

This script turns the manual grep audit described in the contract into a machine-enforced gate. It runs on every PR. Any new code that introduces a schema literal is caught immediately, not at cutover.

### 6. `fix-auth-schema.js` — Retirement Decision

**Decision: DELETE**. The script's role was to normalize `pgSchema("auth")` calls in `auth-schema.ts`. With `namespaces.ts` as the canonical source, `auth-schema.ts` no longer calls `pgSchema()` directly — the instance is imported. The script has no remaining purpose and its presence creates confusion (the five `[AUTO-FIXED]` banner lines in `auth-schema.ts` are evidence of this). Deleting it removes an obsolete maintenance surface and the associated banner comments.

### 7. Better Auth — No Change Required

`src/lib/auth.ts` passes the entire schema module (`import * as schema from "@/db/schema/auth-schema"`) into `drizzleAdapter`. Once `auth-schema.ts` derives its tables from `authSchema` (which resolves to `app_auth`), Better Auth queries resolve automatically. No change to `auth.ts` is needed or permitted.

---

## Canary & Observability

### Startup Schema Canary

Add a lightweight readiness check executed once at application startup (or as a Next.js health endpoint):

```ts
// src/lib/db/schema-health.ts  [NEW — optional, startup-only]
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function assertAuthSchemaReachable(): Promise<void> {
  await db.execute(sql`SELECT 1 FROM app_auth.user LIMIT 1`);
}
// Called in: src/app/api/health/route.ts or server startup hook.
// On failure: throws — deployment health check fails, traffic is not routed to broken instance.
```

**Why this matters**: SC-003 says "watch logs for 30 days for `relation 'auth.*' does not exist` errors." That is a **reactive** signal — the error means a real user's request already failed. The canary converts it into a **proactive** signal: the broken deployment never receives traffic. This is the difference between a P1 incident and a non-incident.

**Scope note**: The canary is a lightweight addition — a single SQL query in a health endpoint. It does not introduce a new architectural layer and does not require a new runtime dependency.

### Log Monitoring (Complement, Not Replacement)

SC-003 30-day log monitoring remains active as a complement, covering the window between the canary check and steady-state operations. Alert on any occurrence of `relation "auth"` in production logs (not `app_auth` — that string is correct).

---

## Cutover Protocol (Gate-Based)

> Applied in order. Each gate must pass before the next begins. Any failure triggers the rollback path.

```
Gate 1: PRE-CUTOVER
  ├── [ ] pnpm audit:schema-literals  →  exit 0 (zero violations)
  ├── [ ] pnpm typecheck              →  zero errors
  ├── [ ] pnpm lint                   →  zero errors (incl. import/no-cycle)
  ├── [ ] pnpm test                   →  all pass
  ├── [ ] Cross-repo consumer audit   →  all known consumers of auth.* confirmed updated or isolated
  └── [ ] Dump confirmed available    →  restore tested on scratch DB; migrate passes; diff clean

Gate 2: ANNOUNCEMENT
  ├── [ ] Engineering announces maintenance window (template in quickstart.md §2)
  ├── [ ] Platform maintenance mode enabled (if applicable)
  └── [ ] On-call engineer confirmed available

Gate 3: DEPLOY
  ├── [ ] Code deployment applied against already-renamed shared DB
  ├── [ ] Startup canary passes       →  SELECT 1 FROM app_auth.user LIMIT 1 succeeds
  └── [ ] No immediate error spike in logs

Gate 4: SMOKE TESTS
  ├── [ ] Sign in with an existing account (session resume)
  ├── [ ] Sign up a new user
  ├── [ ] Password reset + OTP sign-in
  ├── [ ] Executive analytics page loads with correct counts
  └── [ ] Admin audit log shows records

Gate 5: ALL-CLEAR
  ├── [ ] Maintenance mode disabled
  ├── [ ] Engineering all-clear notification sent
  └── [ ] 30-day log monitoring alert configured (alert on "relation \"auth\"" in logs)
```

### Rollback Path

1. Restore the database from the dump (pre-rename state).
2. Revert the code deployment.
3. Restore the pre-rebase `drizzle/` + `drizzle/meta/` files from source control.
4. Disable the startup canary temporarily if it blocks the rollback health check.
5. Confirm all smoke tests pass against the rolled-back state.

**Rollback SLA validation**: Before the maintenance window, measure the actual dump restore time + pipeline redeployment time in the staging environment. SC-005 requires ≤ 30 minutes. If measured time exceeds 25 minutes (5-minute safety margin), escalate and reschedule until the SLA is achievable.

---

## Cross-Repo Consumer Gate

The `auth` schema is consumed by application code in this repository. It may also be consumed by:
- Other internal services / reporting tools connecting directly to the database.
- External analytics or BI tools using a read replica.
- Database-level grants or Row Level Security policies referencing the schema name.

**Gate requirement (pre-cutover)**: An engineer must audit all known consumers before the maintenance window. This is a coordination responsibility, not a code change — but it is a hard gate. The cutover does not proceed if any unknown or uncoordinated consumer exists.

**Action**: Add `docs/consumer-audit-020.md` as a pre-cutover checklist populated by the team lead.

---

## Complexity Tracking

> Filled because Constitution gate II / AGENTS.md "small patches" is deliberately exceeded for the migration history and the additional hardening deliverables.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Rebase/edit ~25 historical migration files + snapshots | Shared DB is already renamed; fresh environments must reproduce `app_auth` or every new deploy re-creates the colliding `auth` schema | Patching only current code leaves migration history pointing at the old schema name, guaranteeing the next `db:migrate` on a fresh environment fails |
| Idempotent `IF NOT EXISTS` guards in baseline | `db:migrate` runs against a dump-restored DB that already has `app_auth`; bare `CREATE SCHEMA` fails | Skipping guards means the migration always errors on the first run against the shared DB |
| Centralize all schema names (not just auth) | FR-013/SC-007: next rename must be one-line; scoped to a thin facade, not a new layer | Only renaming `auth` leaves 5 other schema names scattered, keeping the failure mode alive |
| `audit-schema-literals.mjs` CI script | Automating the audit makes it PR-gated, not human-gated; prevents regression | A manual grep is not enforced on PRs and will be skipped under time pressure |
| `fix-auth-schema.js` deletion | Eliminates dual-write confusion and obsolete banner comments | Keeping it in `NO CHANGE` limbo leaves an unmaintained script that may break on the new namespaces.ts model |
| `Object.values(DB_SCHEMAS)` in `schemaFilter` | Satisfies OCP: new schemas flow through automatically | Manually listed `schemaFilter` silently misses new schemas and violates OCP |
| Startup canary | Converts 30-day passive log watch into an immediate pre-traffic signal | Passive monitoring alone allows user-facing errors before detection |
| Written ORM analysis deliverable | FR-014/FR-015: decision-support for migration-history pain | Skipping it leaves the recurring "push schema to make it work" issue unexamined |

---

## Definition of Done

All items below must be checked before this branch is merged. No exceptions.

- [ ] `namespaces.ts` created; exports `DB_SCHEMAS`, `DbSchemaName`, and all five `pgSchema()` instances.
- [ ] All schema-definition modules (`auth-schema.ts`, `admin-db.schema.ts`, `courses-db.schema.ts`, `certificates-db.schema.ts`, `email-db.schema.ts`, `executive-analytics.schema.ts`) import from `namespaces.ts` — no direct `pgSchema()` literals.
- [ ] `auth-schema.ts` has zero `[AUTO-FIXED]` banner comments.
- [ ] `fix-auth-schema.js` deleted from the repository.
- [ ] Executive repository: all 7 raw SQL sites use `sql.identifier(DB_SCHEMAS.auth)`.
- [ ] `drizzle.config.ts` `schemaFilter` uses `[...Object.values(DB_SCHEMAS), "public"]`.
- [ ] `drizzle/0000_*.sql` regenerated with `IF NOT EXISTS` guards on all `CREATE` statements.
- [ ] All `drizzle/*.sql` and `drizzle/meta/*.json` files reference `app_auth` — zero `auth.` occurrences outside the allowlist.
- [ ] `pnpm audit:schema-literals` exits 0 on the final state of the branch.
- [ ] `pnpm typecheck` exits 0.
- [ ] `pnpm lint` exits 0 (including `import/no-cycle` for `namespaces.ts`).
- [ ] `pnpm test` exits 0 (all unit + integration tests pass).
- [ ] Fresh restore → `db:migrate` → `drizzle-kit generate` produces zero drift (clean diff).
- [ ] Second fresh restore confirms reproducibility.
- [ ] `docs/frontend-nextjs-schema-auth-guide.md` updated to `app_auth` + contract link.
- [ ] `AGENTS.md` SPECKIT markers updated.
- [ ] `orm-analysis.md` exists in `specs/020-auth-schema-migration/` with all required sections (FR-014, SC-008).
- [ ] Startup canary implemented (health endpoint or startup hook).
- [ ] Rollback SLA validated against actual dump size and pipeline time.
- [ ] Cross-repo consumer audit completed and documented in `docs/consumer-audit-020.md`.
- [ ] Cutover protocol gates all checked and signed off during maintenance window.
