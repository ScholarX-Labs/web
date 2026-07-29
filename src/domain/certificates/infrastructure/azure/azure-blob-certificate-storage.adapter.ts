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
    const accountNameMatch = this.connectionString.match(/AccountName=([^;]+)/);
    const accountKeyMatch = this.connectionString.match(/AccountKey=([^;]+)/);
    const endpointSuffixMatch = this.connectionString.match(/EndpointSuffix=([^;]+)/);

    const accountName = accountNameMatch ? accountNameMatch[1] : "";
    const accountKey = accountKeyMatch ? accountKeyMatch[1] : "";
    const endpointSuffix = endpointSuffixMatch ? endpointSuffixMatch[1] : "core.windows.net";

    const baseUrl = `https://${accountName}.blob.${endpointSuffix}/${input.container}/${input.key}`;

    if (!accountKey) {
      // Fallback: return the blob URL directly (public container scenario)
      return baseUrl;
    }

    const expiresOn = new Date(
      Date.now() + (input.expiresInSeconds ?? 300) * 1000,
    );

    const signedPermissions = "r";
    const signedStart = "";
    const signedExpiry = expiresOn.toISOString().substring(0, 19) + "Z";
    const canonicalizedResource = `/blob/${accountName}/${input.container}/${input.key}`;
    const signedIdentifier = "";
    const signedIP = "";
    const signedProtocol = "https";
    const signedVersion = "2025-01-05"; // Azure Storage API Version
    const signedResource = "b"; // Blob
    const snapshotTime = "";
    const encryptionScope = "";
    const rscc = "";
    const rscd = input.filename
      ? `attachment; filename="${input.filename}"`
      : 'attachment; filename="certificate.pdf"';
    const rsce = "";
    const rscl = "";
    const rsct = "application/pdf";

    const stringToSign = [
      signedPermissions,
      signedStart,
      signedExpiry,
      canonicalizedResource,
      signedIdentifier,
      signedIP,
      signedProtocol,
      signedVersion,
      signedResource,
      snapshotTime,
      encryptionScope,
      rscc,
      rscd,
      rsce,
      rscl,
      rsct,
    ].join("\n");

    const keyBuffer = Buffer.from(accountKey, "base64");
    // We use Web Crypto API or Node crypto
    // Since we're on the server, we use Node's crypto
    const crypto = await import("crypto");
    const signature = crypto
      .createHmac("sha256", keyBuffer)
      .update(stringToSign, "utf8")
      .digest("base64");

    const queryParams = new URLSearchParams({
      sv: signedVersion,
      se: signedExpiry,
      sr: signedResource,
      sp: signedPermissions,
      spr: signedProtocol,
      sig: signature,
      rscd: rscd,
      rsct: rsct,
    });

    return `${baseUrl}?${queryParams.toString()}`;
  }

  async delete(key: string, container: string): Promise<void> {
    const client = await this.getClient();
    const containerClient = client.getContainerClient(container);
    await containerClient.deleteBlob(key);
  }

  async getMetadata(
    key: string,
    container: string,
  ): Promise<{ byteSize: number; contentType: string } | null> {
    const client = await this.getClient();
    const containerClient = client.getContainerClient(container);
    const blobClient = containerClient.getBlockBlobClient(key);

    try {
      const properties = await blobClient.getProperties();
      return {
        byteSize: properties.contentLength ?? 0,
        contentType: properties.contentType ?? "application/octet-stream",
      };
    } catch (error: unknown) {
      if ((error as { statusCode?: number })?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
}
