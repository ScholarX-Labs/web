import "dotenv/config";
import { db } from "@/db";
import { dbCertificateArtifactQueue } from "@/db/schema/certificates-db.schema";
import { and, eq, isNull, lt } from "drizzle-orm";

async function main() {
  const olderThanMs = 2 * 60 * 1000;
  const cutoff = new Date(Date.now() - olderThanMs);
  
  const query = db
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

  console.log(query.toSQL());
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
