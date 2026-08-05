import "dotenv/config";
import { db } from "@/db";
import { dbCertificateArtifacts, dbCertificateArtifactQueue, dbCanonicalCertificates } from "@/db/schema/certificates-db.schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  // Get all artifacts that are pending
  const pending = await db
    .select({
      artifactId: dbCertificateArtifacts.id,
      certNum: dbCanonicalCertificates.certificateNumber,
      status: dbCertificateArtifacts.status,
      templateVersion: dbCertificateArtifacts.templateVersion,
    })
    .from(dbCertificateArtifacts)
    .innerJoin(dbCanonicalCertificates, eq(dbCertificateArtifacts.certificateId, dbCanonicalCertificates.id))
    .where(eq(dbCertificateArtifacts.status, "pending"));

  console.log(`Pending artifacts: ${pending.length}`);
  for (const a of pending) {
    console.log(`\n  Artifact ${a.artifactId} (${a.certNum} / ${a.templateVersion})`);

    const outboxRows = await db
      .select({ id: dbCertificateArtifactQueue.id, status: dbCertificateArtifactQueue.status, publishedAt: dbCertificateArtifactQueue.publishedAt, messageId: dbCertificateArtifactQueue.messageId, createdAt: dbCertificateArtifactQueue.createdAt })
      .from(dbCertificateArtifactQueue)
      .where(eq(dbCertificateArtifactQueue.artifactId, a.artifactId));

    if (!outboxRows.length) {
      console.log("    NO outbox rows! Certificate will never be generated.");
    } else {
      for (const r of outboxRows) {
        console.log(`    Outbox ${r.id}: status=${r.status}, publishedAt=${r.publishedAt}, createdAt=${r.createdAt}`);
      }
    }
  }
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
