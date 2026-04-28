/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");

(async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    console.log("\n== Connected to database ==\n");
    await client.query("BEGIN");

    const checkInstructor = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema='courses' AND table_name='courses' AND column_name='instructor_id'`,
    );

    if (
      checkInstructor.rows.length > 0 &&
      checkInstructor.rows[0].data_type !== "text"
    ) {
      console.log("Altering courses.instructor_id -> text");
      await client.query(
        `ALTER TABLE "courses"."courses" ALTER COLUMN instructor_id TYPE text USING instructor_id::text`,
      );
    } else {
      console.log("courses.instructor_id already text or not present");
    }

    const checkUserId = await client.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema='courses' AND table_name='subscriptions' AND column_name='user_id'`,
    );

    if (
      checkUserId.rows.length > 0 &&
      checkUserId.rows[0].data_type !== "text"
    ) {
      console.log("Altering courses.subscriptions.user_id -> text");
      await client.query(
        `ALTER TABLE "courses"."subscriptions" ALTER COLUMN user_id TYPE text USING user_id::text`,
      );
    } else {
      console.log("courses.subscriptions.user_id already text or not present");
    }

    await client.query("COMMIT");
    console.log("\n== Conversion complete ==\n");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Conversion failed:", err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
