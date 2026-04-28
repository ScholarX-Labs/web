import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as url from "url";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Ensure explicit SSL mode only when DATABASE_SSL is enabled to avoid
// attempting TLS handshakes against local/dev Postgres instances.
const parsedUrl = new url.URL(connectionString);
const enableSsl = process.env.DATABASE_SSL?.toLowerCase() === "true";
if (enableSsl) {
  const currentSslMode = parsedUrl.searchParams.get("sslmode");
  if (
    !currentSslMode ||
    ["prefer", "require", "verify-ca"].includes(currentSslMode)
  ) {
    // Force verify-full to avoid deprecation warnings and ensure strict TLS validation.
    // The 'pg' driver currently treats 'require' etc. as 'verify-full' but will change this in v9.
    parsedUrl.searchParams.set("sslmode", "verify-full");
  }
}
const connectionStringWithSslMode = parsedUrl.toString();

// You can specify any property from the node-postgres connection options
export const db = drizzle({
  connection: {
    connectionString: connectionStringWithSslMode,
    ssl: enableSsl ? true : undefined,
  },
});
