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

    const colsRes = await client.query(`
      SELECT table_schema, table_name, column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'certificates'
      ORDER BY table_name, ordinal_position;
    `);
    console.log("Column metadata for certificates schema:");
    console.log(JSON.stringify(colsRes.rows, null, 2));

  } catch (err) {
    console.error("Inspection failed:", err);
  } finally {
    await client.end();
  }
})();
