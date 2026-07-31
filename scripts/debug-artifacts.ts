/**
 * Quick diagnostic: print all certificate artifacts from the database
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dbCertificateArtifacts, dbCanonicalCertificates } from "@/db/schema/certificates-db.schema";

async function main() {
  const certs = await db.select({
    certNum: dbCanonicalCertificates.certificateNumber,
    status: dbCertificateArtifacts.status,
    storageKey: dbCertificateArtifacts.storageKey,
    storageContainer: dbCertificateArtifacts.storageContainer,
    byteSize: dbCertificateArtifacts.byteSize,
    contentType: dbCertificateArtifacts.contentType,
    errorCode: dbCertificateArtifacts.errorCode,
    artifactType: dbCertificateArtifacts.artifactType,
    templateVersion: dbCertificateArtifacts.templateVersion,
  }).from(dbCertificateArtifacts)
    .innerJoin(dbCanonicalCertificates, eq(dbCertificateArtifacts.certificateId, dbCanonicalCertificates.id));

  for (const c of certs) {
    console.log(JSON.stringify(c, null, 2));
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
