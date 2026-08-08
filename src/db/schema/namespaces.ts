import { pgSchema } from "drizzle-orm/pg-core";

/**
 * DB_SCHEMAS is the registry for PostgreSQL schema names used by TypeScript
 * builders and drizzle.config.ts schemaFilter. It is not a generator for
 * static SQL or shell-script literals.
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
