import { config } from 'dotenv';
config();
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

async function main() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error('No connection string');
  
  const client = BlobServiceClient.fromConnectionString(connectionString);
  const container = 'certificates';
  const key = 'certificates/SX-14PN-3HR1-A608-K7FT-9XHX-8W2R-HK/scholarx-v2/certificate.pdf';
  
  const containerClient = client.getContainerClient(container);
  const blobClient = containerClient.getBlockBlobClient(key);
  
  try {
    const props = await blobClient.getProperties();
    console.log('Blob exists!', props.contentLength);
  } catch (e) {
    console.log('Blob does not exist:', e instanceof Error ? e.message : e);
  }
}
main().catch(console.error);
