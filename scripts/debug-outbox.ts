import "dotenv/config";
import { db } from "@/db";
import { dbCertificateArtifactQueue } from "@/db/schema/certificates-db.schema";

async function main() {
  const rows = await db.select().from(dbCertificateArtifactQueue);
  console.log(`Total outbox rows: ${rows.length}`);
  for (const r of rows) {
    console.log(JSON.stringify({
      id: r.id,
      status: r.status,
      publishedAt: r.publishedAt,
      attempts: r.attempts,
      messageId: r.messageId,
      createdAt: r.createdAt,
    }, null, 2));
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
