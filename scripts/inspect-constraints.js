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

    const res = await client.query(`
      SELECT
        con.conname AS constraint_name,
        nsp.nspname AS table_schema,
        rel.relname AS table_name,
        att.attname AS column_name,
        fnsp.nspname AS foreign_table_schema,
        frel.relname AS foreign_table_name,
        fatt.attname AS foreign_column_name,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      JOIN pg_class frel ON frel.oid = con.confrelid
      JOIN pg_namespace fnsp ON fnsp.oid = frel.relnamespace
      LEFT JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS col(attnum, ord) ON true
      LEFT JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS fcol(attnum, ord) ON fcol.ord = col.ord
      LEFT JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = col.attnum
      LEFT JOIN pg_attribute fatt ON fatt.attrelid = frel.oid AND fatt.attnum = fcol.attnum
      WHERE con.contype = 'f'
        AND (nsp.nspname='courses' AND rel.relname IN ('courses','subscriptions'))
      ORDER BY con.conname;
    `);

    console.log("Foreign key constraints touching courses.*:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error("Inspect constraints failed:", err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
})();
