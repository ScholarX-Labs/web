import "dotenv/config";
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  const tz = await db.execute(sql`SHOW TIMEZONE`);
  const now = await db.execute(sql`SELECT NOW(), CURRENT_TIMESTAMP`);
  console.log("TIMEZONE:", tz.rows);
  console.log("NOW:", now.rows);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
