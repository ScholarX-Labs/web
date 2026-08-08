import { config } from 'dotenv';
config();
import { db } from '@/db';
import { dbCertificateArtifacts, dbCanonicalCertificates } from '@/db/schema/certificates-db.schema';
import { eq } from 'drizzle-orm';
import { AzureBlobCertificateStorageAdapter } from '@/domain/certificates/infrastructure/azure/azure-blob-certificate-storage.adapter';
async function main() {
  const certificateNumber = 'SX-14PN-3HR1-A608-K7FT-9XHX-8W2R-HK';
  const certs = await db
    .select()
    .from(dbCanonicalCertificates)
    .where(eq(dbCanonicalCertificates.certificateNumber, certificateNumber))
    .limit(1);
  const cert = certs[0];
  if (!cert) { console.log('Not found in DB'); process.exit(0); }
  const artifacts = await db
    .select()
    .from(dbCertificateArtifacts)
    .where(eq(dbCertificateArtifacts.certificateId, cert.id));
  const pdf = artifacts.find(a => a.artifactType === 'pdf');
  if (!pdf) { console.log('No pdf artifact'); process.exit(0); }
  console.log('Artifact status:', pdf.status);
  console.log('Storage key:', pdf.storageKey);
  console.log('Storage container:', pdf.storageContainer);
  const storage = new AzureBlobCertificateStorageAdapter();
  try {
    const meta = await storage.getMetadata(pdf.storageKey!, pdf.storageContainer!);
    console.log('Blob Metadata:', meta);
  } catch(e) {
    console.log('Blob error:', e instanceof Error ? e.message : e);
  }
  process.exit(0);
}
main().catch(console.error);
