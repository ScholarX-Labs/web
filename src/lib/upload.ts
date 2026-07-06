import { BlobServiceClient } from "@azure/storage-blob";
import sharp from "sharp";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 1 * 1024 * 1024;
const AVATAR_MAX_DIMENSION = 512;
const AVATAR_CONTAINER = "avatars";

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png": [0x89, 0x50, 0x4E, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

function getBlobServiceClient(): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new UploadError(
      "STORAGE_NOT_CONFIGURED",
      503,
      "AZURE_STORAGE_CONNECTION_STRING is not configured."
    );
  }
  return BlobServiceClient.fromConnectionString(connectionString);
}

export class UploadError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export function detectMagicBytes(buffer: Buffer): string | null {
  for (const [mime, sig] of Object.entries(MAGIC_BYTES)) {
    if (buffer.length >= sig.length && sig.every((b, i) => buffer[i] === b)) {
      return mime;
    }
  }
  return null;
}

export async function processAvatar(inputBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(inputBuffer)
      .resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new UploadError(
      "SHARP_REENCODE_FAILED",
      422,
      "Image processing failed — file may be corrupt"
    );
  }
}

export async function uploadAvatar(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new UploadError(
      "FILE_TOO_LARGE",
      413,
      `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    );
  }

  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    throw new UploadError(
      "INVALID_FILE_TYPE",
      415,
      `Accepted types: ${ACCEPTED_MIME_TYPES.join(", ")}`
    );
  }

  const detectedMime = detectMagicBytes(fileBuffer);
  if (detectedMime !== mimeType) {
    throw new UploadError(
      "INVALID_MAGIC_BYTES",
      415,
      "File content does not match declared type"
    );
  }

  const processedBuffer = await processAvatar(fileBuffer);

  const blobName = `${userId}/${crypto.randomUUID()}.jpg`;

  try {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(AVATAR_CONTAINER);
    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.uploadData(processedBuffer, {
      blobHTTPHeaders: {
        blobContentType: "image/jpeg",
        blobCacheControl: "public, max-age=86400",
      },
    });
    return blobClient.url;
  } catch (error) {
    if (error instanceof UploadError) throw error;
    // Provide a more specific message for common Azure errors
    const azureCode = (error as { code?: string })?.code;
    if (azureCode === "ContainerNotFound") {
      throw new UploadError(
        "CONTAINER_NOT_FOUND",
        503,
        `Azure Blob container '${AVATAR_CONTAINER}' does not exist. Create it in the Azure Portal.`
      );
    }
    if (azureCode === "PublicAccessNotPermitted") {
      throw new UploadError(
        "PUBLIC_ACCESS_DENIED",
        503,
        "Storage account has public blob access disabled. Set 'Allow Blob public access' in Azure Portal, or use a private container with SAS tokens."
      );
    }
    console.error("[upload] Azure upload error:", error);
    throw new UploadError("UPLOAD_FAILED", 500, "Failed to upload to storage");
  }
}

export async function deleteAvatar(blobUrl: string): Promise<void> {
  try {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(AVATAR_CONTAINER);
    // Extract blob name from the full URL: everything after the container segment
    const url = new URL(blobUrl);
    // pathname is like /<container>/<blobName>
    const segments = url.pathname.split("/").filter(Boolean);
    // segments[0] = container name, rest = blob name parts
    const blobName = segments.slice(1).join("/");
    if (blobName) {
      await containerClient.deleteBlob(blobName);
    }
  } catch (error) {
    console.error("[upload] Failed to delete old avatar:", error);
  }
}

export function getAvatarKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    // segments[0] = container, rest = blob name
    if (segments.length < 2) return null;
    return segments.slice(1).join("/");
  } catch {
    return null;
  }
}

export async function calculateAzureStorageUsage(): Promise<number> {
  try {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(AVATAR_CONTAINER);
    
    if (!(await containerClient.exists())) {
      return 0;
    }

    let totalBytes = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      totalBytes += blob.properties.contentLength || 0;
    }
    return totalBytes;
  } catch (error) {
    console.error("[upload] Failed to calculate Azure storage usage:", error);
    return 0;
  }
}
