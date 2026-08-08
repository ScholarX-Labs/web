# ORM & Migration Tooling Analysis

**Deliverable**: FR-014 / FR-015 / SC-008 — decision-support only. No production code or database state is changed by this document.
**Feature**: `020-auth-schema-migration`
**Author**: Engineering (2026-08-06)
**Status**: Reviewed by principal SWE review

---

## 1. Executive Summary

ScholarX currently uses Drizzle ORM (0.45) with `drizzle-kit` for schema management. The auth-schema migration surfaced recurring pain: the migration journal and the live database drifted, and the team compensated by running `drizzle-kit push` ("push schema to make it work") instead of repairing the migration chain. This feature absorbs that lesson by centralizing schema names and rebasing the baseline — but the underlying tooling question remains: should ScholarX keep Drizzle, adopt Prisma, move to versioned SQL migrations, or build a thin custom runner?

**Recommendation: Stay on Drizzle ORM + drizzle-kit for runtime and schema-definition ergonomics, but move the migration journal to a source-controlled, hand-auditable versioned-SQL model** (a lightweight `node-pg-migrate`-style runner over hand-written `up`/`down` SQL) for anything that must be idempotent or environment-reproducible. This is a team decision; the concrete migration chain fix in this feature proceeds regardless (see §6).

---

## 2. Problem History (Why This Analysis Exists)

| Symptom | Root Cause | Impact |
|---------|-----------|--------|
| "Push schema to make it work" | Journal/database drift: the `__drizzle_migrations` table did not reflect the applied schema state, so `db:migrate` failed or was unsafe; `db:push` was used as a repair hammer | Non-reproducible environments; manual repair; no rollback path |
| Migration chain gaps (`0005–0012`, `0015–0020` missing snapshots) | Hand-edited journals, `breakpoints: false` entries, and hybrid generation | `drizzle-kit generate` diffs against partial snapshots; drift is easy to introduce |
| Schema rename (`auth` → `app_auth`) required ~54 statement edits across ~25 files | Schema name was a literal scattered across schema modules, raw SQL, scripts, and docs | No single source of truth; renames are error-prone |
| Baseline script complexity (`baseline-drizzle-migrations.mjs`) | Necessary because the journal starts before tables that were actually created out-of-band | Two sources of truth for "what is applied": the DB and the journal |

None of these are Drizzle-specific defects. They are symptoms of treating a generated migration chain as an append-only ledger while also repairing the schema out-of-band (`db:push`). Any ORM with generated migrations will exhibit the same failure mode if the same operational pattern is followed.

---

## 3. Requirements a Migration Solution Must Meet

1. **Reproducible fresh environments** — a clean DB restore + migrate must produce the exact target schema with zero manual repair.
2. **Idempotency** — must succeed against dump-restored DBs where the target schema already exists (`IF NOT EXISTS` semantics).
3. **Auditable history** — humans must be able to review what changed and when; rollback must be possible.
4. **Multi-schema support** — `app_auth`, `courses`, `certificates`, `email`, `executive`, `public` (leaderboard).
5. **Better Auth adapter compatibility** — Better Auth uses a Drizzle adapter and expects table objects; schema provenance must remain transparent.
6. **Minimal operational overhead** — no new always-on service, no per-developer setup tax.
7. **No silent drift** — schema-definition changes must either produce a migration or fail the build (no `db:push` escape hatch used in production).

---

## 4. Options Compared

### Option A — Keep Drizzle ORM + drizzle-kit (status quo, hardened)

- **Migration-history reliability**: Good once the chain is rebased and drift gates (`audit:schema-literals`, `db:generate` zero-diff in CI) are enforced. Generated snapshots are consistent by construction.
- **Schema introspection**: Excellent for diff generation; `drizzle-kit push` exists but must be banned from production.
- **Multi-schema**: First-class (`pgSchema`, `schemaFilter`). This is the strongest fit.
- **Better Auth impact**: Zero — Better Auth already uses the Drizzle adapter.
- **Dependency/lockfile**: No change.
- **Migration effort**: Moderate one-time rebase (this feature); ongoing low.
- **Risks**: Generated migrations are black-box for humans; `push` remains one command away from reintroducing drift; snapshot diffs require discipline.

### Option B — Prisma Migrate

- **Migration-history reliability**: Good — Prisma's migration engine is mature and tracks a proper `_prisma_migrations` table with checksums and rollback support.
- **Schema introspection**: Excellent (Prisma schema DSL + introspection), but requires a full schema-DSL migration (`schema.prisma`) — a large, risky rewrite of 6 schema modules plus every raw-SQL site.
- **Multi-schema**: Poor-to-average. Prisma's native support for multiple PostgreSQL schemas is limited (per-model `@@map`/`schema` support arrived late and remains awkward; `multiSchema` preview historically required `db push`/migrate hacks). This is the main disqualifier.
- **Better Auth impact**: Better Auth's Drizzle adapter would not work with Prisma; we would need Better Auth's Prisma adapter and a rewrite of `src/lib/auth.ts` + all Drizzle queries in the email, executive, leaderboard, and courses domains. Large surface.
- **Dependency/lockfile**: Prisma already appears in `onlyBuiltDependencies` (engines present), so binary availability is not the blocker — but adoption is.
- **Migration effort**: Very high; effectively a cross-cutting ORM rewrite.
- **Risks**: Would invalidate the entire Drizzle schema layer and domain repositories; high regression surface for auth.

### Option C — node-pg-migrate / Kysely-style versioned SQL migrations (with Drizzle kept for queries)

- **Migration-history reliability**: Excellent — plain SQL files with `up`/`down`, run in order, recorded in a simple table. Fully auditable and hand-editable; idempotency is under the author's control (`IF NOT EXISTS`).
- **Schema introspection**: None — schema changes are authored by hand. Drizzle would still be used for type-safe queries, but DDL is manual.
- **Multi-schema**: First-class — it's just SQL.
- **Better Auth impact**: None — Better Auth keeps the Drizzle adapter for queries; only DDL ownership moves.
- **Dependency/lockfile**: Adds `node-pg-migrate` (or a ~50-line custom runner) as a devDependency; no runtime change.
- **Migration effort**: Low-to-moderate — the current chain is already a mix of generated and hand-written SQL; formalizing it is natural. One-time baseline rebase overlaps with this feature.
- **Risks**: Manual DDL can drift from schema modules; mitigated by a CI `drizzle-kit generate` zero-diff check that fails if schema modules and SQL disagree.

### Option D — Custom thin migration runner (own code)

- **Migration-history reliability**: Depends entirely on discipline; no ecosystem hardening.
- **Schema introspection**: None.
- **Multi-schema / Better Auth**: Same as Option C.
- **Migration effort**: High to build well (locking, ordering, hashing, rollback), low ongoing.
- **Risks**: Maintaining a bespoke migration system is a recurring tax; rejected unless the team explicitly wants zero new dependencies. `node-pg-migrate` is mature enough that a custom runner is not justified.

---

## 5. Tradeoff Matrix

| Criterion | A: Drizzle-kit (hardened) | B: Prisma Migrate | C: node-pg-migrate + Drizzle | D: Custom runner |
|---|---|---|---|---|
| Multi-schema support | ★★★ | ★ | ★★★ | ★★★ |
| Auditability of history | ★★ (generated) | ★★★ | ★★★ (hand SQL) | ★★★ |
| Idempotent restore ergonomics | ★★ (needs guards) | ★★ | ★★★ (author-controlled) | ★★★ |
| Better Auth adapter fit | ★★★ | ★ | ★★★ | ★★★ |
| Introspection / diffing | ★★★ | ★★★ | — | — |
| Migration effort (this feature) | Moderate | Very high | Low-moderate | High |
| Operational risk | Low (if push banned) | Low | Low | Depends |

---

## 6. Recommendation (Decision Support)

**Phase 1 — now (this feature)**: Keep Drizzle ORM + drizzle-kit. Complete the baseline rebase with `IF NOT EXISTS` guards, enforce `audit:schema-literals` in CI, and add a CI gate that runs `drizzle-kit generate` and fails on a non-empty diff. Ban `drizzle-kit push` for shared/production environments (document in `quickstart.md`).

**Phase 2 — next quarter (team decision)**: Evaluate moving DDL ownership to versioned SQL via `node-pg-migrate` while retaining Drizzle for queries and Better Auth. Pilot on a non-auth domain (e.g. `email` schema) to validate the workflow before touching the auth baseline. Keep the CI zero-diff gate as the guardrail that detects schema-module/SQL drift.

**Explicit non-goals**: Do not migrate to Prisma. The multi-schema limitation and the Better Auth adapter rewrite make it a poor fit for ScholarX despite Prisma's otherwise strong migration engine. Do not build a custom runner unless a zero-new-dependency constraint is team policy.

---

## 7. What This Feature Already Delivers

Regardless of the tooling decision above, `020-auth-schema-migration` lands the following durability improvements that de-risk any future migration tooling choice:

- Single source of truth for schema names (`namespaces.ts`) — renames are one-line.
- Verification-as-code (`audit:schema-literals`) — schema-literal regressions are PR-blocked.
- Idempotent baseline with `IF NOT EXISTS` guards — fresh and dump-restored environments both work.
- Startup canary — a broken schema deployment never receives traffic.
- Gate-based cutover protocol with a measured rollback SLA — operational, not aspirational.
