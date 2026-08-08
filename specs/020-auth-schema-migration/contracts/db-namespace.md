# Contract: Database Namespace Resolution

**Status**: Active (part of `020-auth-schema-migration`)
**Scope**: Every PostgreSQL schema name used by the ScholarX application, tooling, and migrations.
**Reviewed**: 2026-08-05 — principal SWE review findings F-02, F-06, F-09 incorporated.

---

## Purpose

A single, typed, authoritative source for schema names so that renaming a namespace is a **one-line change** and application code, raw SQL, Drizzle tooling, and scripts cannot drift apart. This contract defines the shape of that source, the rules every consumer must follow, and the automated enforcement that makes those rules PR-gated rather than human-gated.

---

## 1. Canonical Module

**Path**: `src/db/schema/namespaces.ts`
**Runtime cost**: zero — plain constants + `pgSchema()` calls, no dynamic resolution.
**Structural invariant**: This is a **leaf module**. It MUST NOT import from any other `src/db/` module. The `import/no-cycle` ESLint rule (scoped to `src/db/schema/`) enforces this mechanically.

### Required Exports

```ts
// src/db/schema/namespaces.ts
import { pgSchema } from "drizzle-orm/pg-core";

/**
 * DB_SCHEMAS is the registry for PostgreSQL schema names used by TypeScript
 * builders and drizzle.config.ts schemaFilter. It is not a generator for
 * static SQL or shell-script literals.
 */
export const DB_SCHEMAS = {
  auth:         "app_auth",
  courses:      "courses",
  certificates: "certificates",
  email:        "email",
  executive:    "executive",
} as const;

/** Union of all physical schema name strings. Use to type schema-aware parameters. */
export type DbSchemaName = (typeof DB_SCHEMAS)[keyof typeof DB_SCHEMAS];

// Derived pgSchema() instances. Consumers import these — never call pgSchema() directly.
export const authSchema         = pgSchema(DB_SCHEMAS.auth);
export const coursesSchema      = pgSchema(DB_SCHEMAS.courses);
export const certificatesSchema = pgSchema(DB_SCHEMAS.certificates);
export const emailSchema        = pgSchema(DB_SCHEMAS.email);
export const executiveSchema    = pgSchema(DB_SCHEMAS.executive);
```

**Notes**:
- `public` is intentionally absent. Leaderboard tables use the default PostgreSQL schema and require no `pgSchema()` call.
- The `as const` assertion narrows value types to string literals, enabling exhaustive type checks and preventing accidental broadening to `string`.

---

## 2. Consumer Rules

| Consumer | Rule | Rationale |
|----------|------|-----------|
| Schema definition modules (`src/db/schema/*.ts`) | MUST import their `pgSchema()` instance from `namespaces.ts`. MUST NOT call `pgSchema()` with a string literal. | DIP: depend on the abstraction, not the physical name. |
| `drizzle.config.ts` | MUST derive `schemaFilter` as `[...Object.values(DB_SCHEMAS), "public"]`. MUST NOT use a manually maintained array. | OCP: adding a new schema to `DB_SCHEMAS` propagates automatically — no second edit required. |
| Drizzle ORM query code | No direct change needed — table objects carry their schema through the instance. | — |
| Raw SQL in repositories | MUST interpolate the schema identifier via `sql.identifier(DB_SCHEMAS.<key>)` inside a Drizzle `sql` tagged template. MUST NOT use a string literal like `"app_auth".user`. | Injection-safe, typed, and follows from `namespaces.ts` automatically. |
| Node scripts (`.js` / `.mjs` — cannot import TS) | MUST read `process.env.AUTH_SCHEMA ?? "app_auth"` for the auth schema. MUST NOT hardcode `"auth"` or `"app_auth"`. | Env-with-correct-default: production value is the default; override is possible in dev/test without a code change. |
| Generated migrations (`drizzle/*.sql`, `drizzle/meta/*.json`) | MUST be regenerated from the canonical schema. All `CREATE` statements in the baseline `0000` MUST use `IF NOT EXISTS` guards. | Idempotency: `db:migrate` must succeed against dump-restored environments where `app_auth` already exists. |
| Documentation / runbooks | MUST reference `app_auth` and link to this contract. MUST NOT refer to `auth` as a schema name. | Consistency; prevents future confusion. |

---

## 3. Changing a Schema Name

To relocate any namespace in the future:

1. Edit **exactly one value** in `DB_SCHEMAS` in `namespaces.ts`.
2. Regenerate migrations: `pnpm db:generate`. The new SQL will reference the new physical name.
3. Run full verification (see §5).
4. No other code change is permitted or required — all consumers derive from the map.

This is the definition of SC-007: "Relocating the identity schema again requires changing exactly one configuration definition."

---

## 4. Structural Enforcement

### `import/no-cycle` (ESLint)

`namespaces.ts` must remain a leaf. Add to ESLint config:

```js
// eslint.config.* or .eslintrc
{
  files: ["src/db/schema/**"],
  rules: {
    "import/no-cycle": ["error", { maxDepth: 1 }],
  },
}
```

This prevents `namespaces.ts` from accidentally importing from a schema-definition module that itself imports from `namespaces.ts`, which would create a circular dependency and break the module-load order.

### `pnpm audit:schema-literals` (CI Script)

A dedicated CI script (`scripts/audit-schema-literals.mjs`) runs on every PR as part of `pnpm lint`. It greps `src/`, `drizzle/`, `scripts/`, and `docs/` for:

| Prohibited Pattern | Reason |
|--------------------|--------|
| `pgSchema("auth")` | Bypasses canonical source |
| `pgSchema('auth')` | Bypasses canonical source |
| `"auth".` | Raw schema-qualified SQL literal |
| `'auth'.` | Raw schema-qualified SQL literal |
| `from auth.` | Raw SQL reference |
| `join auth.` | Raw SQL reference |
| `schema: "auth"` | Config literal |

**Allowlist** (patterns in these paths are ignored):
- `drizzle/meta/` — historical snapshot JSON (read-only reference material)
- `specs/020-auth-schema-migration/research.md` — quoted examples in documentation

Exit code `0` = clean. Exit code `1` = violations found (file path + line number printed). A non-zero exit fails the CI run.

---

## 5. Verification Checklist

Run in order after implementing all changes:

```bash
# 1. Schema-literal audit (Verification-as-Code)
pnpm audit:schema-literals          # must exit 0

# 2. Type safety
pnpm typecheck                      # must exit 0

# 3. Lint (includes import/no-cycle)
pnpm lint                           # must exit 0

# 4. Unit + integration tests
pnpm test                           # must exit 0

# 5. Fresh-restore migration test
# Restore dump to scratch DB → run db:migrate → run db:generate
pnpm db:migrate                     # must complete with 0 errors
pnpm db:generate                    # schema-diff must be empty (no drift)

# 6. Second restore (reproducibility confirmation)
# Repeat step 5 on a new scratch DB

# 7. Runtime smoke tests
# Sign in / sign up / password-reset / OTP / executive analytics / audit log
```

---

## 6. Out of Scope

- Changing table or column names.
- Changing database connection or credential handling beyond env-only usage (FR-007).
- Physical DDL in the shared database (already performed by the database specialist).
- Any changes to `src/lib/auth.ts` (follows `namespaces.ts` automatically).
