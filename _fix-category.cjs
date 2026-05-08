require("dotenv/config");
const { drizzle } = require("drizzle-orm/node-postgres");

const db = drizzle({ connection: { connectionString: process.env.DATABASE_URL } });

async function main() {
  const { sql } = require("drizzle-orm");

  // 1. Show distinct categories
  const rows = await db.execute(sql`SELECT DISTINCT category FROM courses.courses ORDER BY category`);
  console.log("Distinct categories before fix:", JSON.stringify(rows, null, 2));

  // 2. Check for lowercase "development"
  const devRows = await db.execute(sql`SELECT id, title, category FROM courses.courses WHERE LOWER(category) = 'development'`);
  console.log("Courses with category 'development':", JSON.stringify(devRows, null, 2));

  // 3. Update any lowercase "development" to "Development"
  if (devRows.length > 0) {
    const result = await db.execute(sql`UPDATE courses.courses SET category = 'Development' WHERE LOWER(category) = 'development'`);
    console.log("Update result:", JSON.stringify(result, null, 2));
  } else {
    console.log("No courses found with category 'development' (case-insensitive). Nothing to update.");
  }

  // 4. Verify
  const after = await db.execute(sql`SELECT DISTINCT category FROM courses.courses ORDER BY category`);
  console.log("Distinct categories after fix:", JSON.stringify(after, null, 2));

  process.exit(0);
}
main().catch((err) => { console.error(err); process.exit(1); });
