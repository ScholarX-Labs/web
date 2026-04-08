# Frontend Next.js Schema and Auth Integration Guide

## Purpose

This document explains how the backend (NestJS + Drizzle) structures database
schemas, how we isolate the Courses domain in a separate PostgreSQL namespace,
and how the frontend Next.js team should manage authentication data so both
teams remain decoupled.

## Current Backend Database Model

### Namespace Ownership

- Backend domain namespace: courses
- Auth table currently referenced by backend: public.users (reference-only in
  this repo)
- Migration ownership in this repo: courses schema only

### Why This Matters

- Backend can evolve Courses tables without touching auth-owned tables.
- Auth team can evolve users/auth tables without backend migration conflicts.
- Reduced risk of accidental cross-team schema changes.

## Backend Schema Folder Structure

```text
src/
  db/
    schema/
      index.ts                    # Exports all schema modules
      namespaces.ts               # Defines pgSchema('courses')
      auth/
        users.ts                  # Reference-only contract to auth users table
      courses/
        index.ts                  # Barrel exports for courses domain
        courses.ts                # courses.courses table
        lessons.ts                # courses.lessons table
        subscriptions.ts          # courses.subscriptions table
        relations.ts              # Drizzle relations
```

## How Namespace Isolation Is Implemented

### 1) Dedicated schema object for Courses

In src/db/schema/namespaces.ts we define:

```ts
export const coursesSchema = pgSchema('courses');
```

All Courses tables are created via coursesSchema.table(...), so they live under
courses.\* in PostgreSQL.

### 2) Migrations scoped only to Courses

In drizzle.config.ts:

- schema points to src/db/schema/courses/index.ts
- schemaFilter is ['courses']

This ensures drizzle-kit only generates/applies migrations for courses schema
and ignores public/users or any other namespaces.

### 3) Auth table used as reference-only

src/db/schema/auth/users.ts is intentionally not part of backend migrations. It
exists only so Drizzle can type-check foreign keys and relations.

## Recommended Frontend (Next.js) Ownership Model

### Primary Rule

The Next.js/Auth team should own all authentication and identity schema objects
in a separate namespace from courses (for example: auth).

### Suggested namespace options

- Preferred: auth.users, auth.sessions, auth.accounts,
  auth.verification_tokens
- Acceptable (current compatibility): public.users while transitioning

### What to avoid

- Do not create auth tables inside courses namespace.
- Do not apply frontend migrations with schemaFilter that includes courses.
- Do not couple frontend migration scripts to backend course models.

## Contract Between Teams

Treat the user identity table as a shared contract.

### Required user identity fields (minimum contract)

- id (UUID primary key)
- email (unique)
- name (nullable or not-null per auth policy)
- created_at
- updated_at

Optional profile fields can evolve independently if the contract remains
backward compatible.

## Frontend Drizzle Configuration Pattern

If frontend owns auth namespace, configure drizzle-kit to target auth only.

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/auth/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ['auth'],
  strict: true,
  verbose: true,
});
```

## Auth in Frontend: Best-Practice Integration

### Authentication flow

- Use secure, httpOnly, sameSite cookies for session/JWT storage.
- Keep token verification and session resolution on the server side (Route
  Handlers, Server Actions, or middleware where appropriate).
- Expose minimal user shape to the client (id, name, avatar, role claims if
  needed).

### Authorization and role mapping

- Keep role/permission source of truth with auth domain.
- Backend services should trust signed claims or verify via auth service
  endpoint.
- Avoid duplicating role logic across frontend and backend without a shared
  contract.

### Session resilience

- Implement refresh token rotation or durable server sessions.
- Add explicit expiry and revocation handling.
- Log auth events (sign-in, refresh, revoke, sign-out) for auditability.

## Decoupling Checklist

- Backend migrations only manage courses schema.
- Frontend/auth migrations only manage auth (or public during migration window).
- Cross-domain references use stable IDs (UUID), not business-coupled fields.
- Shared user contract is versioned and documented.
- Breaking contract changes are coordinated via release notes.

## Migration Path (If Moving from public.users to auth.users)

1. Create auth.users with required contract columns.
2. Backfill data from public.users to auth.users.
3. Update backend reference table definition to auth.users (or a compatibility
   view).
4. Update FK references if needed through controlled migration.
5. Keep a rollback plan and validate all joins/relations.

## Team Operating Model

- Backend team owns: courses schema, course relations, course migrations.
- Frontend/Auth team owns: identity/auth schemas, auth migrations, login/session
  logic.
- Shared responsibility: user contract versioning and compatibility
  communication.

## Quick Summary for Frontend Team

- Yes, backend is already isolated in courses namespace.
- Keep auth schema separate (prefer auth namespace).
- Scope your migration config so frontend cannot affect courses schema.
- Maintain a strict shared user identity contract and evolve it safely.
