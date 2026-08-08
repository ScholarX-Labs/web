# Specification Quality Checklist: Auth Schema Migration to `app_auth`

**Purpose**: Validate specification completeness and quality before proceeding to planning and implementation.
**Created**: 2026-08-05
**Updated**: 2026-08-05 (principal SWE review — F-10 resolved: orm-analysis.md added as DoD gate)
**Feature**: [spec.md](../spec.md)

---

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

---

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified (active sessions, interrupted migration, pooled DDL, mixed-schema state, idempotent restore, downstream consumers)
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows (P1 sign-in continuity, P2 fresh environment, P3 analytics, P2 one-line rename, P3 ORM analysis)
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

---

## Implementation Plan Quality (updated after principal SWE review)

- [x] SOLID principles explicitly mapped to implementation decisions
- [x] Design patterns documented and justified (SSOT, Facade, Strategy, Guard Clause, Canary, Verification-as-Code, Chain-of-Responsibility)
- [x] `Object.values(DB_SCHEMAS)` used for `schemaFilter` — OCP satisfied
- [x] Migration baseline uses `IF NOT EXISTS` guards — idempotency guaranteed
- [x] `fix-auth-schema.js` retirement decision made explicit (DELETE)
- [x] Startup canary specified (proactive health signal before traffic reaches broken schema)
- [x] Gate-based cutover protocol defined (5 sequential gates, each with rollback trigger)
- [x] Cross-repo consumer audit included as a hard pre-cutover gate
- [x] Rollback SLA (SC-005) requires validation before maintenance window, not during incident
- [x] `import/no-cycle` ESLint rule specified to enforce `namespaces.ts` leaf invariant
- [x] `pnpm audit:schema-literals` CI script specified (Verification-as-Code pattern)

---

## Definition of Done Gates

All items below are **hard gates** — the branch may not merge until every item is checked.

- [ ] `namespaces.ts` created and all schema modules import from it
- [ ] `fix-auth-schema.js` deleted; zero `[AUTO-FIXED]` comments in `auth-schema.ts`
- [ ] `drizzle/0000` regenerated with `IF NOT EXISTS` on all `CREATE` statements
- [ ] `pnpm audit:schema-literals` exits 0
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm lint` exits 0 (including `import/no-cycle`)
- [ ] `pnpm test` exits 0
- [ ] Fresh restore → migrate → zero-drift confirmed (twice)
- [ ] Startup canary implemented and passing
- [ ] Rollback SLA validated against actual dump size + pipeline time
- [ ] Cross-repo consumer audit documented in `docs/consumer-audit-020.md`
- [ ] `orm-analysis.md` exists in `specs/020-auth-schema-migration/` and is reviewed ← **FR-014 / SC-008 hard gate**
- [ ] `docs/frontend-nextjs-schema-auth-guide.md` updated
- [ ] `AGENTS.md` SPECKIT markers updated
- [ ] Cutover gates all signed off during maintenance window

---

## Notes

- Validation passed 2026-08-05. FR-011/FR-012 resolved via user decisions (maintenance window acceptable; rename already complete in DB).
- FR-013 (centralized namespace), FR-014/FR-015 (ORM analysis) added per user request.
- Principal SWE review 2026-08-05: F-01 (idempotency), F-02 (OCP schemaFilter), F-03 (canary), F-04 (fix-auth-schema.js), F-05 (rollback SLA), F-06 (audit CI), F-07 (cutover protocol), F-08 (cross-repo gate), F-09 (import/no-cycle), F-10 (orm-analysis.md DoD) — all resolved.
- Spec is ready for `/speckit.tasks`.
