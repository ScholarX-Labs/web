import "dotenv/config";
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.execute(sql`
    SELECT id, queue_name, status, created_at
    FROM certificates.certificate_artifact_queue
    WHERE status = 'pending'
  `);
  console.log(result.rows);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
