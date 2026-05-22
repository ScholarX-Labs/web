/**
 * AzureBlobCertificateStorageAdapter
 *
 * Wraps the Azure Blob Storage SDK behind ICertificateStoragePort.
 * This adapter is loaded ONLY in the worker process via the factory.
 * It must NEVER be imported from Next.js pages, Client Components, or
 * route metadata — see architectural constraints in the plan.
 *
 * SDK: @azure/storage-blob (lazily required at runtime so the Next.js
 * bundle never includes the Azure SDK).
 */
import type {
  ICertificateStoragePort,
  CertificateStorageUploadInput,
  CertificateStorageDownloadUrlInput,
} from "../../contracts/certificate-storage.port";
import { CertificateError } from "../../domain/certificate-errors";

export class AzureBlobCertificateStorageAdapter
  implements ICertificateStoragePort
{
  private readonly connectionString: string;

  constructor(connectionString?: string) {
    const cs =
      connectionString ?? process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!cs) {
      throw new CertificateError(
        "INTERNAL_ERROR",
        500,
        "AZURE_STORAGE_CONNECTION_STRING is not configured.",
      );
    }
    this.connectionString = cs;
  }

  private async getClient() {
    // Lazy import keeps Azure SDK out of the Next.js bundle
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- @azure/storage-blob is installed in the worker container, not the web bundle
    const { BlobServiceClient } = await import("@azure/storage-blob");
    return BlobServiceClient.fromConnectionString(this.connectionString);
  }

  async upload(input: CertificateStorageUploadInput): Promise<void> {
    const client = await this.getClient();
    const containerClient = client.getContainerClient(input.container);
    const blobClient = containerClient.getBlockBlobClient(input.key);

    await blobClient.uploadData(input.content, {
      blobHTTPHeaders: { blobContentType: input.contentType },
    });
  }

  async getDownloadUrl(
    input: CertificateStorageDownloadUrlInput,
  ): Promise<string> {
    const client = await this.getClient();
    const containerClient = client.getContainerClient(input.container);
    const blobClient = containerClient.getBlockBlobClient(input.key);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- @azure/storage-blob is installed in the worker container, not the web bundle
    const blobSdkImport = await import("@azure/storage-blob");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = blobSdkImport;

    const accountName = client.accountName;
    const accountKey = this.connectionString
      .split(";")
      .find((p) => p.startsWith("AccountKey="))
      ?.replace("AccountKey=", "");

    if (!accountKey) {
      // Fallback: return the blob URL directly (public container scenario)
      return blobClient.url;
    }

    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const expiresOn = new Date(
      Date.now() + (input.expiresInSeconds ?? 300) * 1000,
    );

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: input.container,
        blobName: input.key,
        permissions: BlobSASPermissions.parse("r"),
        expiresOn,
      },
      credential,
    ).toString();

    return `${blobClient.url}?${sasToken}`;
  }

  async delete(key: string, container: string): Promise<void> {
    const client = await this.getClient();
    const containerClient = client.getContainerClient(container);
    await containerClient.deleteBlob(key);
  }
}
