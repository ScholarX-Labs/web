/* eslint-disable @typescript-eslint/no-require-imports */
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

    const tablesRes = await client.query(`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name IN ('courses','subscriptions')
      ORDER BY table_schema, table_name;
    `);
    console.log("Tables named courses/subscriptions:");
    console.log(JSON.stringify(tablesRes.rows, null, 2));

    const colsRes = await client.query(`
      SELECT table_schema, table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE (table_schema IN ('courses','public','auth') AND table_name IN ('courses','subscriptions'))
         OR (table_schema='auth' AND table_name='user' AND column_name='id')
      ORDER BY table_schema, table_name, ordinal_position;
    `);
    console.log("\nColumn metadata for relevant tables:");
    console.log(JSON.stringify(colsRes.rows, null, 2));

    const tablesToCount = [
      { schema: "courses", table: "courses" },
      { schema: "courses", table: "subscriptions" },
      { schema: "auth", table: "user" },
    ];

    console.log("\nRow counts (errors shown if table missing):");
    for (const t of tablesToCount) {
      try {
        const res = await client.query(
          `SELECT COUNT(*) AS cnt FROM "${t.schema}"."${t.table}"`,
        );
        console.log(`${t.schema}.${t.table}: ${res.rows[0].cnt}`);
      } catch (err) {
        console.log(`${t.schema}.${t.table}: ERROR - ${err.message}`);
      }
    }

    console.log("\n== Inspection complete ==\n");
  } catch (err) {
    console.error("Inspection failed:", err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
