import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as url from "url";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Ensure explicit SSL mode to avoid pg-connection-string deprecation warning
const parsedUrl = new url.URL(connectionString);
if (!parsedUrl.searchParams.has("sslmode")) {
  parsedUrl.searchParams.set("sslmode", "verify-full");
}
const connectionStringWithSslMode = parsedUrl.toString();

// You can specify any property from the node-postgres connection options
export const db = drizzle({
  connection: {
    connectionString: connectionStringWithSslMode,
    ssl: process.env.DATABASE_SSL?.toLowerCase() === "true" ? true : undefined,
  },
});
