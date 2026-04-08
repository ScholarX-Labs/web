# Database (Drizzle ORM)

PostgreSQL database accessed via [Drizzle ORM](https://orm.drizzle.team), using the `node-postgres` driver.

## Environment Variables

| Variable       | Description                                                                       |
| -------------- | --------------------------------------------------------------------------------- |
| `DATABASE_URL` | Full PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/dbname` |

Set it in your `.env` file (or via Doppler):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/scholarx
```

## Schema

Schemas live in `src/db/schema/`. Each file exports Drizzle table definitions. The glob `./src/db/schema/*` is picked up automatically by `drizzle.config.ts`.

## Usage

Import the `db` instance anywhere on the server:

```ts
import { db } from "@/db";
import { user } from "@/db/schema/auth-schema";

const users = await db.select().from(user);
```

## Migrations

Migrations are generated into the `drizzle/` directory.

```bash
# Generate a new migration after schema changes
pnpm drizzle-kit generate

# Apply pending migrations to the database
pnpm drizzle-kit migrate

# Open Drizzle Studio (local DB browser)
pnpm drizzle-kit studio
```
