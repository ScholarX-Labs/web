import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { DB_SCHEMAS } from "./src/db/schema/namespaces";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const dbUrl = new URL(connectionString);
const enableSsl = process.env.DATABASE_SSL?.toLowerCase() === "true";
const currentSslMode = dbUrl.searchParams.get("sslmode");

if (
  (enableSsl && !currentSslMode) ||
  (currentSslMode && ["prefer", "require", "verify-ca"].includes(currentSslMode))
) {
  dbUrl.searchParams.set("sslmode", "verify-full");
}

export default defineConfig({
  out: "./drizzle",
  schema: [
    "./src/db/schema/namespaces.ts",
    "./src/db/schema/auth-schema.ts",
    "./src/db/schema/contact-us-schema.ts",
    "./src/db/schema/courses-db.schema.ts",
    "./src/db/schema/admin-db.schema.ts",
    "./src/db/schema/certificates-db.schema.ts",
    "./src/db/schema/email-db.schema.ts",
    "./src/db/schema/leaderboard.ts",
    "./src/db/schema/lesson-tasks.schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl.toString(),
  },
  schemaFilter: [...Object.values(DB_SCHEMAS), "public"],
});
