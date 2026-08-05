import "dotenv/config";
import { db } from "@/db";
import { dbCertificateArtifactQueue } from "@/db/schema/certificates-db.schema";
import { and, eq, isNull, lt } from "drizzle-orm";

async function main() {
  process.env.TZ = "Africa/Cairo";
  
  const olderThanMs = 2 * 60 * 1000;
  // Let's mock Date.now() to be exactly 18:24:00 UTC
  const mockNow = new Date("2026-07-31T18:24:00Z").getTime();
  const cutoff = new Date(mockNow - olderThanMs);
  
  console.log("Mock now:", new Date(mockNow).toISOString());
  console.log("Cutoff:", cutoff.toISOString());
  console.log("Cutoff toString:", cutoff.toString());
  
  const query = db
    .select({ id: dbCertificateArtifactQueue.id })
    .from(dbCertificateArtifactQueue)
    .where(
      and(
        eq(dbCertificateArtifactQueue.status, "pending"),
        isNull(dbCertificateArtifactQueue.publishedAt),
        lt(dbCertificateArtifactQueue.createdAt, cutoff),
      )
    );
    
  console.log("SQL:", query.toSQL());

  const rows = await query;
  console.log(`findUnpublished returned ${rows.length} rows`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
