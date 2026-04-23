import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: [
    "./src/db/schema/auth-schema.ts",
    "./src/db/schema/contact-us-schema.ts",
    "./src/domain/courses/infrastructure/db/courses-db.schema.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["auth", "public", "courses"],
});
