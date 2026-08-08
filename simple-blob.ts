import { config } from 'dotenv';
config();
import { BlobServiceClient } from '@azure/storage-blob';

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
  } catch (e: unknown) {
    const errObj = e as { statusCode?: number; details?: { errorCode?: string } } | undefined;
    const is404 = errObj?.statusCode === 404 || errObj?.details?.errorCode === 'BlobNotFound';
    if (is404) {
      console.log('Blob does not exist:', e instanceof Error ? e.message : e);
    } else {
      console.log('Blob error:', e instanceof Error ? e.message : e);
    }
    process.exitCode = 1;
  }
}
main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
