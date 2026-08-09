/**
 * src/lib/upload.ts
 *
 * Application-level upload helpers for avatars and course images.
 * Storage is delegated to the active IImageStoragePort adapter
 * (selected by UPLOAD_STORAGE_ADAPTER env var — "vercel" by default).
 *
 * This module is intentionally free of any storage-SDK imports.
 * All provider-specific code lives in src/lib/storage/adapters/.
 */
import sharp from "sharp";
import { createImageStorageAdapter } from "@/lib/storage";

// Import locally and re-export so existing route imports (`import { UploadError } from "@/lib/upload"`) continue working.
import { UploadError } from "@/lib/upload-errors";
export { UploadError } from "@/lib/upload-errors";


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const AVATAR_MAX_DIMENSION = 512;
const AVATAR_PATH_PREFIX = "avatars";

export const COURSE_IMAGE_MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel server upload limit is 4.5 MB)
const COURSE_IMAGE_MAX_DIMENSION = 1920;
const COURSE_IMAGE_PATH_PREFIX = "course-images";
const COURSE_IMAGE_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xFF, 0xD8, 0xFF],
  "image/png": [0x89, 0x50, 0x4E, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

export function detectMagicBytes(buffer: Buffer): string | null {
  for (const [mime, sig] of Object.entries(MAGIC_BYTES)) {
    if (buffer.length >= sig.length && sig.every((b, i) => buffer[i] === b)) {
      return mime;
    }
  }
  return null;
}

export function isValidIdentifier(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

// ---------------------------------------------------------------------------
// Image processing
// ---------------------------------------------------------------------------

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
      "Image processing failed — file may be corrupt",
    );
  }
}

export async function processCourseImage(inputBuffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(inputBuffer)
      .resize(COURSE_IMAGE_MAX_DIMENSION, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new UploadError(
      "SHARP_REENCODE_FAILED",
      422,
      "Image processing failed — file may be corrupt",
    );
  }
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export async function uploadAvatar(
  userId: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!isValidIdentifier(userId)) {
    throw new UploadError(
      "INVALID_IDENTIFIER",
      400,
      "Invalid user identifier",
    );
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new UploadError(
      "FILE_TOO_LARGE",
      413,
      `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    );
  }

  if (!ACCEPTED_MIME_TYPES.includes(mimeType)) {
    throw new UploadError(
      "INVALID_FILE_TYPE",
      415,
      `Accepted types: ${ACCEPTED_MIME_TYPES.join(", ")}`,
    );
  }

  const detectedMime = detectMagicBytes(fileBuffer);
  if (detectedMime !== mimeType) {
    throw new UploadError(
      "INVALID_MAGIC_BYTES",
      415,
      "File content does not match declared type",
    );
  }

  const processedBuffer = await processAvatar(fileBuffer);
  const path = `${AVATAR_PATH_PREFIX}/${userId}/${crypto.randomUUID()}.jpg`;

  const adapter = createImageStorageAdapter();
  return adapter.upload({
    path,
    content: processedBuffer,
    contentType: "image/jpeg",
    cacheControl: "public, max-age=86400",
  });
}

export async function deleteAvatar(blobUrl: string): Promise<void> {
  const adapter = createImageStorageAdapter();
  await adapter.deleteByUrl(blobUrl);
}

/**
 * Extract the storage key from an avatar URL.
 * Works for both Azure (/avatars/<blobName>) and Vercel Blob URLs.
 */
export function getAvatarKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    // Azure: segments[0] = container, rest = blob name
    // Vercel: segments[0] = path prefix (avatars), rest = blob name
    return segments.slice(1).join("/");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Course image
// ---------------------------------------------------------------------------

export async function uploadCourseImage(
  courseId: string,
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!isValidIdentifier(courseId)) {
    throw new UploadError(
      "INVALID_IDENTIFIER",
      400,
      "Invalid course identifier",
    );
  }

  if (fileBuffer.length > COURSE_IMAGE_MAX_FILE_SIZE) {
    throw new UploadError(
      "FILE_TOO_LARGE",
      413,
      `File exceeds ${COURSE_IMAGE_MAX_FILE_SIZE / 1024 / 1024}MB limit`,
    );
  }

  if (!COURSE_IMAGE_ACCEPTED_TYPES.includes(mimeType)) {
    throw new UploadError(
      "INVALID_FILE_TYPE",
      415,
      `Accepted types: ${COURSE_IMAGE_ACCEPTED_TYPES.join(", ")}`,
    );
  }

  const detectedMime = detectMagicBytes(fileBuffer);
  if (detectedMime !== mimeType) {
    throw new UploadError(
      "INVALID_MAGIC_BYTES",
      415,
      "File content does not match declared type",
    );
  }

  const processedBuffer = await processCourseImage(fileBuffer);
  const path = `${COURSE_IMAGE_PATH_PREFIX}/${courseId}/${crypto.randomUUID()}.jpg`;

  const adapter = createImageStorageAdapter();
  return adapter.upload({
    path,
    content: processedBuffer,
    contentType: "image/jpeg",
    cacheControl: "public, max-age=604800",
  });
}

export async function deleteCourseImage(blobUrl: string): Promise<void> {
  const adapter = createImageStorageAdapter();
  await adapter.deleteByUrl(blobUrl);
}

export function getCourseImageKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    return segments.slice(1).join("/");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Storage usage — provider-agnostic
// ---------------------------------------------------------------------------

/**
 * Calculate total bytes used by image storage (avatars + course images).
 * Delegates to the active adapter so this works with both Vercel Blob and Azure.
 *
 * @deprecated Use calculateStorageUsage() — this alias kept for compatibility.
 */
export async function calculateAzureStorageUsage(): Promise<number> {
  return calculateStorageUsage();
}

export async function calculateStorageUsage(): Promise<number> {
  const adapter = createImageStorageAdapter();
  return adapter.calculateUsageBytes([
    AVATAR_PATH_PREFIX,
    COURSE_IMAGE_PATH_PREFIX,
  ]);
}
