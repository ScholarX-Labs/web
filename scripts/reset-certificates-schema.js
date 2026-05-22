const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

(async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("Dropping existing certificates schema...");
    await client.query("DROP SCHEMA IF EXISTS certificates CASCADE;");
    console.log("Dropped schema successfully.");

    const sqlPath = path.join(__dirname, "../drizzle/migrations/certificates-schema.sql");
    console.log(`Reading SQL migration from: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Applying SQL migration...");
    await client.query(sql);
    console.log("Applied SQL migration successfully!");

  } catch (err) {
    console.error("Reset failed:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
