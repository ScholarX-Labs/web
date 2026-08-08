# Research: Auth Schema Migration to app_auth

**Phase 0 output** — resolves all technical unknowns for the plan. Date: 2026-08-05.

## 1. Decision: Centralize namespace resolution in `src/db/schema/namespaces.ts`

**Decision**: Create one typed module that is the registry for PostgreSQL schema names used by TypeScript builders and `drizzle.config.ts` `schemaFilter`, and derive every `pgSchema()` instance from it (it is not a generator for static SQL or shell-script literals).

**Rationale**:
- Centralizing provides a single registry for TypeScript builders and `drizzle.config.ts` `schemaFilter` (FR-013, SC-007), eliminating hardcoded schema literals in application code, though static SQL and shell scripts are not generated automatically.
- Drizzle's `pgSchema(name)` objects are plain singleton builders; a facade adds no runtime cost and no new architectural layer.
- Typed `as const` map satisfies Constitution principle II (no magic strings, no `any`).
- `drizzle.config.ts` can derive `schemaFilter` from the same map, so tooling and app code cannot drift apart.

**Alternatives considered**:
- Env var (`AUTH_SCHEMA`) as the single source — rejected: introduces config drift between environments, complicates migrations, and env is not typed at schema-build time.
- Keep literals and only rename the two schema-definition files — rejected: leaves raw SQL, scripts, and docs on the old name; fails SC-007.
- Centralize only the auth name — rejected: leaves four other schemas scattered; user asked for the whole namespace setup.

**Contract**: see [contracts/db-namespace.md](contracts/db-namespace.md). Proposed shape:

```ts
export const DB_SCHEMAS = {
  auth: "app_auth",
  courses: "courses",
  certificates: "certificates",
  email: "email",
  executive: "executive",
} as const;

export const authSchema = pgSchema(DB_SCHEMAS.auth);
export const coursesSchema = pgSchema(DB_SCHEMAS.courses);
export const certificatesSchema = pgSchema(DB_SCHEMAS.certificates);
export const emailSchema = pgSchema(DB_SCHEMAS.email);
export const executiveSchema = pgSchema(DB_SCHEMAS.executive);
```

`public` is not declared (leaderboard tables use the default schema).

## 2. Decision: Executive raw SQL resolves the schema via `sql.identifier()`

**Decision**: In `src/domain/executive/infrastructure/db/executive.repository.ts` (lines 343, 382, 426, 445, 900, 989, 1258), replace the literal `auth.user` with a drizzle `sql` template interpolation using the canonical name, e.g. `${sql.identifier(DB_SCHEMAS.auth)}.user`.

**Rationale**:
- The queries are already drizzle `sql` tagged templates; `sql.identifier()` is the correct, injection-safe way to interpolate an identifier.
- Keeps the raw SQL location (data access layer) unchanged; only the schema resolution changes.
- Future renames require editing only `DB_SCHEMAS.auth`.

**Alternatives considered**:
- Plain string interpolation `${DB_SCHEMAS.auth}.user` — acceptable (constant is compile-time) but `sql.identifier()` is the drizzle-idiomatic, quoted-safe form.
- Rewriting these queries with the Drizzle query builder — rejected: broad, risky refactor outside the migration's scope.

## 3. Decision: Tooling scripts read the auth schema name from env with a default

**Decision**: `scripts/baseline-drizzle-migrations.mjs` (line 96) and `scripts/inspect-db.js` (lines 28–29, 38) should resolve the auth schema as `process.env.AUTH_SCHEMA ?? "app_auth"`. The four files in `scripts/migrations/` are one-shot SQL utilities and are updated directly to `app_auth`.

**Rationale**:
- The scripts are plain Node `.mjs`/`.js` and cannot import the TS module; env-with-default keeps a single override point and matches the codebase's existing env-driven tooling pattern.
- The drizzle-generated `drizzle/*.sql` chain is regenerated from the canonical schema (see §4), so generated SQL always follows the single source.

## 4. Decision: Rebase the Drizzle migration chain onto an `app_auth` baseline

**Inventory of affected migration artifacts**: `drizzle/0000` (creates `"auth"` schema + account/session/user/verification + FKs from `courses`), `0001` (`admin_audit_log` + FKs), `0004`, `0021`, `0023`, `0024` (`ALTER "auth"."user"`), `0006/0007/0008`, `0009`, `0013`, `0015`, `0016`, `0017`, `0019`, `0022` (FK references to `"auth"."user"`), plus all `drizzle/meta/*_snapshot.json` table keys (`"auth.account"`, `"auth.session"`, `"auth.user"`, `"auth.verification"`, `"auth.admin_audit_log"`). ~25 SQL files, ~54 schema-qualified statements.

**Decision (recommended path)**: Regenerate a clean baseline rather than hand-patching applied migrations.

- Work against a scratch DB restored from the provided dump (contains the already-renamed `app_auth`).
- After updating the schema definitions to the centralized `app_auth` source, run `drizzle-kit generate` to produce a fresh `0000` snapshot that reflects the entire current schema under `app_auth` (plus `public` leaderboard tables).
- Reset the migration journal/`drizzle/meta/_journal.json` to start from the new `0000`, and update `scripts/baseline-drizzle-migrations.mjs` defaults (`DEFAULT_BASELINE_THROUGH`) and its legacy-schema detection (auth check → `AUTH_SCHEMA`).
- Verify on a *second* fresh restore that `db:migrate` reproduces the schema exactly (schema-diff clean).

**Why regenerate instead of find/replace**: Hand-editing ~54 statements across applied migrations invalidates stored journal hashes and risks a corrupted history — the exact failure mode the user reported ("push schema to make it work"). A regenerated baseline is the production-grade fix: fresh environments reproduce `app_auth`, and the shared DB (already renamed) stays untouched.

**Fallback (if regeneration is not feasible)**: mechanical `"auth".` → `"app_auth".` and `CREATE SCHEMA "auth"` → `CREATE SCHEMA "app_auth"` across `drizzle/*.sql` + snapshots, with careful hash/journal reconciliation. Higher drift risk; only if the scratch-DB approach is blocked.

**Decision**: `drizzle.config.ts` `schemaFilter` becomes derived: `[DB_SCHEMAS.auth, "public", DB_SCHEMAS.courses, DB_SCHEMAS.certificates, DB_SCHEMAS.email]` (executive schema is managed via its own module but included if it participates in generated migrations).

## 5. Decision: Better Auth needs no change beyond the schema source

**Decision**: `src/lib/auth.ts` passes the whole schema module (`import * as schema from "@/db/schema/auth-schema"`) into `drizzleAdapter`. Once `auth-schema.ts` derives its tables from the centralized `authSchema` (`app_auth`), all Better Auth queries resolve automatically. No change to `auth.ts` itself.

**Verification**: sign-in / sign-up / session / password-reset integration tests after the change.

## 6. Decision: Docs and runbooks updated

`docs/frontend-nextjs-schema-auth-guide.md` recommends an `auth` namespace; update the recommended name to `app_auth` and reference the centralized namespace module. Update `AGENTS.md` SPECKIT markers to include `specs/020-auth-schema-migration/plan.md`. Existing spec mentions (`specs/008`, `specs/017`) are historical and left untouched.

## 7. ORM / migration-tooling analysis (FR-014, FR-015)

**Scope**: A written deliverable `orm-analysis.md` (no code/db changes) documenting:
- The concrete migration-history pain points encountered with the current tooling (schema drift requiring `db:push`/`db:generate` workarounds, rebasing complexity demonstrated by this feature).
- Alternatives compared: staying with Drizzle ORM + drizzle-kit; Prisma Migrate; node-pg-migrate / Kysely-style versioned SQL migrations; or a custom thin migration runner.
- Tradeoffs per option: migration-history reliability, schema introspection, multi-schema support, Better Auth adapter impact, lockfile/dependency impact, migration effort.
- A recommendation for the team (decision-support only).

**Constraint**: This deliverable must not change production code or database state.

## Open risks

- **Migration rebase correctness**: mitigated by scratch-DB restore verification and a schema-diff check on a second restore.
- **Pooled connection DDL**: migrations must run on the direct connection (port 5432); port 6543 is for runtime. Documented in quickstart.
- **Journal hash mismatch** if fallback path is used: tracked as a risk; recommended path avoids it.
- **Cross-repo consumers** of the old `auth` schema: out of scope for this repo; documented in spec assumptions.
