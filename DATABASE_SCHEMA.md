# Database Schema

## Overview
ScholarX uses PostgreSQL with Drizzle ORM. Schema definitions live in `src/db/schema`, and migrations are generated into the `drizzle/` directory.

## Schema files
The Drizzle configuration includes the following schema modules:
- `src/db/schema/auth-schema.ts`
- `src/db/schema/contact-us-schema.ts`
- `src/db/schema/courses-db.schema.ts`
- `src/db/schema/admin-db.schema.ts`
- `src/db/schema/certificates-db.schema.ts`
- `src/db/schema/email-db.schema.ts`

## Namespaces
The schema filter includes: `auth`, `public`, `courses`, `certificates`, and `email`.

## Migrations
```bash
pnpm db:generate   # generate migrations
pnpm db:migrate    # apply migrations
pnpm db:push       # push schema (dev convenience)
```

## Notes
- SSL mode is enforced to `verify-full` when SSL is enabled to avoid insecure database connections.
- Refer to the schema files for exact table definitions and relationships.
