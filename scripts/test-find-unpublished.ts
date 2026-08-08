import "dotenv/config";
import { db } from "@/db";
import { dbCertificateArtifactQueue } from "@/db/schema/certificates-db.schema";
import { and, eq, isNull, lt } from "drizzle-orm";

async function main() {
  const olderThanMs = 2 * 60 * 1000;
  const cutoff = new Date(Date.now() - olderThanMs);

  console.log("Date.now():", new Date().toISOString());
  console.log("Cutoff:", cutoff.toISOString());

  const allPending = await db
    .select({
      id: dbCertificateArtifactQueue.id,
      createdAt: dbCertificateArtifactQueue.createdAt,
    })
    .from(dbCertificateArtifactQueue)
    .where(
      and(
        eq(dbCertificateArtifactQueue.status, "pending"),
        isNull(dbCertificateArtifactQueue.publishedAt)
      )
    );

  console.log("All pending rows:");
  for (const r of allPending) {
    console.log(`  id=${r.id}, createdAt=${r.createdAt.toISOString()}`);
    console.log(`  is older than cutoff? ${r.createdAt < cutoff}`);
  }

  const rows = await db
    .select({
      id: dbCertificateArtifactQueue.id,
    })
    .from(dbCertificateArtifactQueue)
    .where(
      and(
        eq(dbCertificateArtifactQueue.status, "pending"),
        isNull(dbCertificateArtifactQueue.publishedAt),
        lt(dbCertificateArtifactQueue.createdAt, cutoff),
      )
    );

  console.log(`findUnpublished returned ${rows.length} rows`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
