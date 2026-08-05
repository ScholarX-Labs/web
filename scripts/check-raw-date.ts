import "dotenv/config";
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT id, status, created_at, created_at::text as created_at_text
    FROM certificates.certificate_artifact_queue
    WHERE status = 'pending'
  `);
  console.log(result.rows);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
