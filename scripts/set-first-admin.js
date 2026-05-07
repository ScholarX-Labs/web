const { Client } = require("pg");

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
      `SELECT id, name, email, role FROM auth."user" WHERE email = $1`,
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

    await client.query(`UPDATE auth."user" SET role = 'admin' WHERE id = $1`, [
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
