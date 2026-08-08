import { Client } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not set");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const hasAuthRes = await client.query(
      "SELECT 1 FROM information_schema.schemata WHERE schema_name = $1",
      ["auth"]
    );
    const hasAppAuthRes = await client.query(
      "SELECT 1 FROM information_schema.schemata WHERE schema_name = $1",
      ["app_auth"]
    );

    const hasAuth = hasAuthRes.rowCount > 0;
    const hasAppAuth = hasAppAuthRes.rowCount > 0;

    console.log(`DB status: schema "auth" exists = ${hasAuth}, schema "app_auth" exists = ${hasAppAuth}`);

    if (hasAuth && !hasAppAuth) {
      console.log('Executing: ALTER SCHEMA "auth" RENAME TO "app_auth";');
      await client.query('ALTER SCHEMA "auth" RENAME TO "app_auth";');
      console.log('Successfully renamed schema "auth" to "app_auth".');
    } else if (hasAppAuth) {
      console.log('Schema "app_auth" already exists.');
    }
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
