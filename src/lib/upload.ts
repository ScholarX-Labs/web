import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { env } from "@/config/env";

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 1 * 1024 * 1024;
const AVATAR_MAX_DIMENSION = 512;

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png": [0x89, 0x50, 0x4E, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY!,
        secretAccessKey: env.R2_SECRET_KEY!,
      },
      requestHandler: {
        requestTimeout: 30_000,
      },
    });
  }
  return r2Client;
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

  const key = `avatars/${userId}/${crypto.randomUUID()}.jpg`;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME!,
    Key: key,
    Body: processedBuffer,
    ContentType: "image/jpeg",
    CacheControl: "public, max-age=86400",
  });

  try {
    await getR2Client().send(command);
  } catch {
    throw new UploadError("UPLOAD_FAILED", 500, "Failed to upload to storage");
  }

  return `${env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteAvatar(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME!,
      Key: key,
    });
    await getR2Client().send(command);
  } catch (error) {
    console.error("[upload] Failed to delete old avatar:", error);
  }
}

export function getAvatarKeyFromUrl(url: string): string | null {
  const prefix = env.R2_PUBLIC_URL + "/";
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}

export async function calculateR2Usage(): Promise<number> {
  let totalBytes = 0;
  let isTruncated = true;
  let continuationToken: string | undefined;

  while (isTruncated) {
    const command = new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME!,
      ContinuationToken: continuationToken,
    });
    const response = await getR2Client().send(command);
    for (const obj of response.Contents ?? []) {
      totalBytes += obj.Size ?? 0;
    }
    isTruncated = response.IsTruncated ?? false;
    continuationToken = response.NextContinuationToken;
  }

  return totalBytes;
}
