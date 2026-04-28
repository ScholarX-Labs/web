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
    const userId = "e3K3FR3Xmy6CsIMjOuwWeOSS0A1QKIRk";
    const courseId = "00000000-0000-0000-0000-000000000002";
    const paymentId = "test-insert-" + Date.now();

    const res = await client.query(
      `INSERT INTO "courses"."subscriptions" (user_id, course_id, amount, status, is_active, payment_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [userId, courseId, 0, "active", true, paymentId],
    );
    console.log("Inserted subscription id:", res.rows[0].id);
  } catch (err) {
    console.error("Insert failed:", err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
