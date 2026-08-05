# AGENTS.md

This file is durable context for AI coding agents working on ScholarX. It should explain how the project is shaped, what must be preserved, and how to make good engineering decisions here. Keep task-specific instructions in the user request, specs, or issue text instead of adding them here.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read `specs/016-course-leaderboard/plan.md`, `specs/017-admin-cash-enrollment/plan.md`, `specs/018-bunny-net-video-migration/plan.md`, `specs/019-interactive-loading-state/plan.md`, and `specs/020-auth-schema-migration/plan.md`.
<!-- SPECKIT END -->

## Product Context

ScholarX is a web platform for scholarship discovery, course browsing, learner profiles, admin operations, and AI-assisted opportunity search. The codebase serves both public marketing/discovery pages and authenticated product workflows, so agents must preserve the boundary between public content, signed-in user experiences, and admin-only surfaces.

The project favors practical, typed, framework-native Next.js code. Prefer the existing domain and component patterns over introducing new abstractions. When a decision is unclear, inspect nearby files and follow the local convention.

## Technical Shape

- Framework: Next.js App Router with React and TypeScript.
- Styling: Tailwind CSS with shared UI primitives and feature-local components.
- Data/auth: Better Auth, Drizzle ORM, server-side session guards, API route handlers, and domain services.
- Client data: TanStack React Query where client-side fetching and cache state are needed.
- Motion and interaction: Framer Motion and existing animation utilities.
- Package scripts, checks, and dependency versions are defined in `package.json`; treat that file as the source of truth instead of copying commands into this guide.

## Repository Boundaries

- `src/app/` contains routes, layouts, metadata, loading states, and route handlers.
- `src/components/` contains shared and feature-specific React components.
- `src/lib/` contains cross-cutting application libraries, API clients, auth helpers, and utilities.
- `src/domain/` contains larger business areas with application, contract, factory, and infrastructure layers.
- `src/db/` and `drizzle/` contain database schema and migration-related code.
- `specs/` contains feature context. Specs explain intent; current code shows what has actually been implemented.

When editing, keep changes inside the smallest meaningful ownership boundary. Do not move logic across layers unless the task requires an architectural change.

## Architectural Principles

Preserve public/auth/admin separation. Public routes must not import authenticated layouts or session guards. Authenticated routes should enforce access at route/layout/server boundaries. Admin behavior should remain isolated from normal user flows.

Keep data normalization close to data access. Raw external API payloads should be converted in library or service layers before reaching UI components. Components should receive stable application-level types.

Use Server Components by default for static, SEO-sensitive, cacheable, or data-fetching pages. Use Client Components only for browser APIs, stateful interactivity, effects, or event handlers.

Keep route handlers thin. They should validate inputs, call a library/domain function, and return a clear response. Business rules belong in services, domain modules, or focused library functions.

Cache intentionally. Public, non-user-specific data can be cached. Authenticated or personalized responses must not be cached publicly. Do not add caching when the data boundary is unclear.

Treat external systems as unreliable. Network calls should fail with controlled null/error results at the boundary, not with uncaught exceptions in rendering paths.

## UI And Product Standards

ScholarX UI should feel polished but functional. Match existing component density, spacing, and motion patterns in the area being edited. Avoid one-off visual systems, broad redesigns, or decorative complexity when the task is about behavior or data flow.

Use existing shared primitives before creating new components. Feature-local primitives are acceptable when the feature already owns a local UI system. Prefer recognizable icons from the installed icon libraries over custom inline drawings.

Public pages should be readable, responsive, metadata-friendly, and safe to share. Authenticated product pages should prioritize task completion, clear state, and predictable navigation.

## Type And Data Standards

Use TypeScript types to express boundaries between raw payloads, normalized application data, and component props. Avoid weakening types to work around mismatches; fix the boundary instead.

Do not pass raw database records, raw external API responses, or auth internals deep into UI trees unless the surrounding code already owns that pattern. Convert to the shape the UI actually needs.

Validate or normalize user-controlled route params, query params, and request bodies before using them in service calls.

## Security And Privacy

Never expose secrets, session internals, tokens, or private environment values to Client Components. Only public environment variables are client-safe.

Do not log sensitive user data. If logging is necessary, log stable identifiers and operational context rather than full payloads.

Do not weaken authentication, authorization, rate limiting, upload validation, or admin boundaries for convenience. If a task conflicts with these boundaries, surface the conflict instead of bypassing it.

## Testing And Completion

Use the repository’s existing scripts and nearby test patterns to decide what to run. Prefer focused verification for narrow changes and broader verification for shared libraries, route behavior, data normalization, auth, caching, or build-sensitive changes.

A task is not complete until the changed behavior is implemented, relevant checks have been considered or run, and any unverified risk is explicitly reported. Documentation-only changes do not require code tests unless they affect generated docs or tooling.

## Working Style For Agents

Read the nearest relevant files before editing. The current implementation may differ from a spec or plan, and the implementation is the immediate source of truth.

Prefer small patches that preserve existing conventions. Avoid opportunistic refactors, dependency additions, formatting churn, or unrelated cleanup.

When multiple reasonable designs exist, choose the one that best matches the existing architecture. If the tradeoff affects public API, auth, data ownership, or cache semantics, make the assumption explicit.

If generated output, local changes, or existing work is present, treat it as user-owned unless the task says otherwise. Do not revert unrelated changes.

## Non-Negotiables

- Do not put public routes behind authentication by accident.
- Do not import server-only modules into Client Components.
- Do not duplicate normalization logic in presentation components.
- Do not expose private data through public caching, metadata, logs, or client bundles.
- Do not introduce new dependencies or architecture layers without a clear project-level reason.
- Do not make broad UI or codebase rewrites for a narrow task.
