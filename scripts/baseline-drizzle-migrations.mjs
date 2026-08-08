import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());



const MIGRATIONS_SCHEMA = "drizzle";
const MIGRATIONS_TABLE = "__drizzle_migrations";
const DEFAULT_BASELINE_THROUGH = "0004_rapid_stone_men";
const COURSE_CATEGORIES_BASELINE_THROUGH = "0005_course_categories";
const AUTH_SCHEMA = process.env.AUTH_SCHEMA ?? "app_auth";

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const parsedUrl = new URL(connectionString);
  const sslMode = parsedUrl.searchParams.get("sslmode");
  const sslRequested = process.env.DATABASE_SSL?.toLowerCase() === "true";

  if (
    (sslRequested && !sslMode) ||
    (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode))
  ) {
    parsedUrl.searchParams.set("sslmode", "verify-full");
  }

  return parsedUrl.toString();
}

function readMigrations() {
  const migrationsDir = path.join(process.cwd(), "drizzle");
  const journalPath = path.join(migrationsDir, "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8"));

  return journal.entries.map((entry) => {
    const migrationSql = fs.readFileSync(
      path.join(migrationsDir, `${entry.tag}.sql`),
      "utf8",
    );

    return {
      tag: entry.tag,
      createdAt: entry.when,
      hash: crypto.createHash("sha256").update(migrationSql).digest("hex"),
    };
  });
}

async function tableExists(client, schema, table) {
  const result = await client.query(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = $1 and table_name = $2
    ) as exists`,
    [schema, table],
  );

  return Boolean(result.rows[0]?.exists);
}

async function main() {
  const migrations = readMigrations();
  const client = new Client({
    connectionString: getConnectionString(),
    ssl: process.env.DATABASE_SSL?.toLowerCase() === "true" ? true : undefined,
  });

  await client.connect();

  try {
    await client.query(`create schema if not exists "${MIGRATIONS_SCHEMA}"`);
    await client.query(`
      create table if not exists "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (
        id serial primary key,
        hash text not null,
        created_at bigint
      )
    `);

    const latestMigration = await client.query(
      `select created_at
       from "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}"
       order by created_at desc
       limit 1`,
    );

    const hasLegacyCourseTable = await tableExists(client, "courses", "courses");
    const hasLegacyUserTable = await tableExists(client, AUTH_SCHEMA, "user");

    if (!hasLegacyCourseTable || !hasLegacyUserTable) {
      if (latestMigration.rowCount > 0) {
        console.log("[db:baseline] Drizzle migration journal already exists.");
        return;
      }

      console.log(
        "[db:baseline] No legacy schema detected. Drizzle will run all migrations.",
      );
      return;
    }

    const hasCourseCategoriesTable = await tableExists(
      client,
      "courses",
      "course_categories",
    );

    const baselineThrough =
      process.env.DRIZZLE_BASELINE_THROUGH ??
      (hasCourseCategoriesTable
        ? COURSE_CATEGORIES_BASELINE_THROUGH
        : DEFAULT_BASELINE_THROUGH);

    const baselineIndex = migrations.findIndex(
      (migration) => migration.tag === baselineThrough,
    );

    if (baselineIndex === -1) {
      throw new Error(
        `Baseline migration '${baselineThrough}' was not found in drizzle/meta/_journal.json`,
      );
    }

    const latestCreatedAt =
      latestMigration.rowCount > 0
        ? Number(latestMigration.rows[0]?.created_at ?? 0)
        : 0;
    const baselineCreatedAt = migrations[baselineIndex].createdAt;

    if (latestCreatedAt >= baselineCreatedAt) {
      console.log(
        `[db:baseline] Drizzle migration journal is already at or beyond ${baselineThrough}.`,
      );
      return;
    }

    const baselineMigrations = migrations
      .slice(0, baselineIndex + 1)
      .filter((migration) => migration.createdAt > latestCreatedAt);

    await client.query("begin");
    for (const migration of baselineMigrations) {
      await client.query(
        `insert into "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ("hash", "created_at")
         values ($1, $2)`,
        [migration.hash, migration.createdAt],
      );
    }
    await client.query("commit");

    console.log(
      `[db:baseline] Recorded ${baselineMigrations.length} existing migrations through ${baselineThrough}.`,
    );
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
