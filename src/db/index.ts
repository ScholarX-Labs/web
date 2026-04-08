import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// You can specify any property from the node-postgres connection options
export const db = drizzle({
  connection: {
    connectionString,
    ssl: process.env.DATABASE_SSL?.toLowerCase() === "true" ? true : undefined,
  },
});
