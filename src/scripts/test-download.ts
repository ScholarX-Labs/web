import { config } from 'dotenv';
config();
import { db } from '../db';
import { dbCertificateArtifacts, dbCanonicalCertificates } from '../db/schema/certificates-db.schema';
import { eq } from 'drizzle-orm';
import { AzureBlobCertificateStorageAdapter } from '../domain/certificates/infrastructure/azure/azure-blob-certificate-storage.adapter';
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
  
  const storage = new AzureBlobCertificateStorageAdapter();
  const url = await storage.getDownloadUrl({
    key: pdf!.storageKey!,
    container: pdf!.storageContainer!,
    expiresInSeconds: 300,
    filename: 'test.pdf'
  });
  console.log('URL:', url);
  
  const fetchRes = await fetch(url);
  console.log('Status:', fetchRes.status, fetchRes.statusText);
  if (!fetchRes.ok) {
    const text = await fetchRes.text();
    console.log('Error Body:', text.substring(0, 500));
  }
  process.exit(0);
}
main().catch(console.error);
