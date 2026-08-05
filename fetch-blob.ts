import { config } from 'dotenv';
config();
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';

async function main() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const client = BlobServiceClient.fromConnectionString(connectionString!);
  const container = 'certificates';
  const key = 'certificates/SX-14PN-3HR1-A608-K7FT-9XHX-8W2R-HK/scholarx-v2/certificate.pdf';
  
  const containerClient = client.getContainerClient(container);
  const blobClient = containerClient.getBlockBlobClient(key);
  
  const accountName = client.accountName;
  const accountKey = connectionString!.split(';').find(p => p.startsWith('AccountKey='))?.replace('AccountKey=', '');
  
  const credential = new StorageSharedKeyCredential(accountName, accountKey);
  const expiresOn = new Date(Date.now() + 300 * 1000);
  
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName: key,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
      contentDisposition: 'attachment; filename="test.pdf"',
      contentType: 'application/pdf',
    },
    credential
  ).toString();
  
  const signedUrl = blobClient.url + '?' + sasToken;
  console.log('Signed URL:', signedUrl);
  
  const res = await fetch(signedUrl, { cache: 'no-store' });
  console.log('Status:', res.status, res.statusText);
  if (!res.ok) {
    const text = await res.text();
    console.log('Error Body:', text);
  } else {
    console.log('Success, length:', (await res.arrayBuffer()).byteLength);
  }
}
main().catch(console.error);
