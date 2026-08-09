/**
 * IImageStoragePort
 *
 * Provider-agnostic interface for avatar and course-image blob storage.
 * Application code (upload.ts, route handlers) depends only on this interface,
 * never on a specific SDK.
 *
 * Implementations:
 *  - VercelBlobImageStorageAdapter  (@vercel/blob — active in production)
 *  - AzureBlobImageStorageAdapter   (@azure/storage-blob — kept for rollback)
 */

export interface ImageUploadInput {
  /**
   * Storage path for the blob, e.g. "avatars/userId/uuid.jpg".
   * This becomes the key in the remote store.
   */
  path: string;
  content: Buffer;
  contentType: string;
  /**
   * HTTP Cache-Control header value to store alongside the blob.
   * e.g. "public, max-age=86400"
   */
  cacheControl?: string;
}

export interface IImageStoragePort {
  /**
   * Upload a file and return its public URL.
   * The returned URL is what gets saved to the database.
   */
  upload(input: ImageUploadInput): Promise<string>;

  /**
   * Delete a file by its full URL (as stored in the DB).
   * Must not throw if the blob no longer exists — orphaned blobs are not fatal.
   */
  deleteByUrl(url: string): Promise<void>;

  /**
   * Sum the byte sizes of all blobs under the given path prefixes.
   * Used by the admin storage-check endpoint to monitor quota.
   */
  calculateUsageBytes(pathPrefixes: string[]): Promise<number>;
}
