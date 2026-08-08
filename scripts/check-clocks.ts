import "dotenv/config";
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`SELECT NOW()`);
  const dbNow = new Date(result.rows[0].now as string).getTime();
  const nodeNow = Date.now();
  console.log("DB NOW:  ", new Date(dbNow).toISOString());
  console.log("NODE NOW:", new Date(nodeNow).toISOString());
  console.log("DIFF (ms):", dbNow - nodeNow);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
