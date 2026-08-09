/**
 * AzureBlobImageStorageAdapter
 *
 * Implements IImageStoragePort using the Azure Blob Storage SDK.
 * Preserved for rollback and future use — set UPLOAD_STORAGE_ADAPTER=azure
 * to activate this adapter instead of Vercel Blob.
 *
 * Path convention: "{container}/{blobName}"
 *   e.g. "avatars/userId/uuid.jpg"
 * The path prefix up to the first "/" is treated as the Azure container name.
 */
import { env } from "@/config/env";
import { BlobServiceClient } from "@azure/storage-blob";
import type { IImageStoragePort, ImageUploadInput } from "../image-storage.port";
import { UploadError } from "@/lib/upload-errors";

function getBlobServiceClient(connectionString: string): BlobServiceClient {
  return BlobServiceClient.fromConnectionString(connectionString);
}

/** Split "container/rest/of/path" → { container, blobName } */
function splitPath(path: string): { container: string; blobName: string } {
  const slash = path.indexOf("/");
  if (slash === -1) {
    throw new UploadError("INVALID_PATH", 500, `Storage path "${path}" has no container segment`);
  }
  return { container: path.substring(0, slash), blobName: path.substring(slash + 1) };
}

export class AzureBlobImageStorageAdapter implements IImageStoragePort {
  private readonly connectionString: string;

  constructor(connectionString?: string) {
    const cs = connectionString ?? env.AZURE_STORAGE_CONNECTION_STRING;
    if (!cs) {
      throw new UploadError(
        "STORAGE_NOT_CONFIGURED",
        503,
        "AZURE_STORAGE_CONNECTION_STRING is not configured.",
      );
    }
    this.connectionString = cs;
  }

  async upload(input: ImageUploadInput): Promise<string> {
    const { container, blobName } = splitPath(input.path);
    try {
      const client = getBlobServiceClient(this.connectionString);
      const containerClient = client.getContainerClient(container);
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.uploadData(input.content, {
        blobHTTPHeaders: {
          blobContentType: input.contentType,
          blobCacheControl: input.cacheControl,
        },
      });
      return blobClient.url;
    } catch (error) {
      if (error instanceof UploadError) throw error;
      const azureCode = (error as { code?: string })?.code;
      if (azureCode === "ContainerNotFound") {
        throw new UploadError(
          "CONTAINER_NOT_FOUND",
          503,
          `Azure Blob container '${container}' does not exist. Create it in the Azure Portal.`,
        );
      }
      if (azureCode === "PublicAccessNotPermitted") {
        throw new UploadError(
          "PUBLIC_ACCESS_DENIED",
          503,
          "Storage account has public blob access disabled.",
        );
      }
      console.error("[azure-blob-image-storage] Upload error:", error);
      throw new UploadError("UPLOAD_FAILED", 500, "Failed to upload to storage");
    }
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const parsed = new URL(url);
      // Azure URL pathname: /<container>/<blobName...>
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length < 2) return;
      const container = segments[0];
      const blobName = segments.slice(1).join("/");
      const client = getBlobServiceClient(this.connectionString);
      const containerClient = client.getContainerClient(container);
      await containerClient.deleteBlob(blobName);
    } catch (error) {
      console.error("[azure-blob-image-storage] Failed to delete blob:", error);
    }
  }

  async calculateUsageBytes(pathPrefixes: string[]): Promise<number> {
    let total = 0;
    try {
      const client = getBlobServiceClient(this.connectionString);
      // Each path prefix starts with the container name
      const containers = [...new Set(pathPrefixes.map((p) => p.split("/")[0]))];
      for (const containerName of containers) {
        const containerClient = client.getContainerClient(containerName);
        if (!(await containerClient.exists())) continue;
        for await (const blob of containerClient.listBlobsFlat()) {
          total += blob.properties.contentLength ?? 0;
        }
      }
    } catch (error) {
      console.error("[azure-blob-image-storage] Failed to calculate usage:", error);
    }
    return total;
  }
}
