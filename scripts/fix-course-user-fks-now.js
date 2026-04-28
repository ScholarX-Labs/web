/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");

(async () => {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }
  const client = new Client({ connectionString: cs });
  await client.connect();
  try {
    console.log("\n== Connected to DB ==\n");
    await client.query("BEGIN");

    console.log("Dropping old FK constraints if they exist...");
    await client.query(
      'ALTER TABLE IF EXISTS "courses"."subscriptions" DROP CONSTRAINT IF EXISTS subscriptions_user_id_users_id_fk',
    );
    await client.query(
      'ALTER TABLE IF EXISTS "courses"."courses" DROP CONSTRAINT IF EXISTS courses_instructor_id_users_id_fk',
    );

    console.log("Altering column types to text...");
    await client.query(
      'ALTER TABLE IF EXISTS "courses"."courses" ALTER COLUMN instructor_id TYPE text USING instructor_id::text',
    );
    await client.query(
      'ALTER TABLE IF EXISTS "courses"."subscriptions" ALTER COLUMN user_id TYPE text USING user_id::text',
    );

    console.log(
      "Skipping adding new FK constraints in this run (to avoid validation issues)",
    );

    await client.query("COMMIT");
    console.log("\n== Done ==");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Failed:", err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
