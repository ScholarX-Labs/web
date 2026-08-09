/**
 * UploadError
 *
 * Typed error for upload and storage failures.
 * Shared by upload.ts and all IImageStoragePort adapters.
 */
export class UploadError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "UploadError";
  }
}
