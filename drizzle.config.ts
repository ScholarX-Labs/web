import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const dbUrl = new URL(connectionString);
const enableSsl = process.env.DATABASE_SSL?.toLowerCase() === "true";

if (enableSsl) {
  const currentSslMode = dbUrl.searchParams.get("sslmode");
  if (
    !currentSslMode ||
    ["prefer", "require", "verify-ca"].includes(currentSslMode)
  ) {
    dbUrl.searchParams.set("sslmode", "verify-full");
  }
}

export default defineConfig({
  out: "./drizzle",
  schema: [
    "./src/db/schema/auth-schema.ts",
    "./src/db/schema/contact-us-schema.ts",
    "./src/domain/courses/infrastructure/db/courses-db.schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl.toString(),
  },
  schemaFilter: ["auth", "public", "courses"],
});
