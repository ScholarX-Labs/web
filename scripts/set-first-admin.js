/* eslint-disable @typescript-eslint/no-require-imports */
const { Client } = require("pg");

const AUTH_SCHEMA = process.env.AUTH_SCHEMA || "app_auth";
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(AUTH_SCHEMA)) {
  console.error(`Invalid AUTH_SCHEMA value: ${AUTH_SCHEMA}`);
  process.exit(1);
}

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/set-first-admin.js <email>");
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const userRes = await client.query(
      `SELECT id, name, email, role FROM "${AUTH_SCHEMA}"."user" WHERE email = $1`,
      [email],
    );

    if (userRes.rows.length === 0) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    const user = userRes.rows[0];
    if (user.role === "admin") {
      console.log(`User ${email} is already an admin.`);
      return;
    }

    await client.query(`UPDATE "${AUTH_SCHEMA}"."user" SET role = 'admin' WHERE id = $1`, [
      user.id,
    ]);

    console.log(`Promoted ${user.name} (${user.email}) to admin.`);
    console.log(`They must sign out and sign back in for the change to take effect.`);
  } catch (err) {
    console.error("Failed to set admin:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
