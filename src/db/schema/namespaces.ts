import { pgSchema } from "drizzle-orm/pg-core";

/**
 * DB_SCHEMAS is the single source of truth for every PostgreSQL schema name.
 * To rename a schema: change exactly one value here. All consumers follow automatically.
 * To add a schema: add one key here. drizzle.config.ts schemaFilter updates automatically.
 */
export const DB_SCHEMAS = {
  auth: "app_auth",
  courses: "courses",
  certificates: "certificates",
  email: "email",
  executive: "executive",
} as const;

/** Union of all physical schema name strings. Use to type schema-aware parameters. */
export type DbSchemaName = (typeof DB_SCHEMAS)[keyof typeof DB_SCHEMAS];

// Derived pgSchema() instances. Consumers import these — never call pgSchema() directly.
export const authSchema = pgSchema(DB_SCHEMAS.auth);
export const coursesSchema = pgSchema(DB_SCHEMAS.courses);
export const certificatesSchema = pgSchema(DB_SCHEMAS.certificates);
export const emailSchema = pgSchema(DB_SCHEMAS.email);
export const executiveSchema = pgSchema(DB_SCHEMAS.executive);
