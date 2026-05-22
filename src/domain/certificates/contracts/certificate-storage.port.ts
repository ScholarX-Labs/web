/**
 * Storage port — abstracts Azure Blob Storage, R2, S3, or in-memory.
 * Application services depend only on this interface.
 */
export interface CertificateStorageUploadInput {
  key: string;
  container: string;
  content: Buffer;
  contentType: string;
}

export interface CertificateStorageDownloadUrlInput {
  key: string;
  container: string;
  /** TTL in seconds for signed URLs */
  expiresInSeconds?: number;
}

export interface ICertificateStoragePort {
  upload(input: CertificateStorageUploadInput): Promise<void>;
  getDownloadUrl(input: CertificateStorageDownloadUrlInput): Promise<string>;
  delete(key: string, container: string): Promise<void>;
}

/**
 * Derive the canonical blob storage key for a certificate artifact.
 * Keys are based on immutable identity (certificateNumber + templateVersion),
 * not on date or attempt count, so regeneration keeps a stable key.
 */
export function buildArtifactStorageKey(
  certificateNumber: string,
  templateVersion: string,
  artifactType: "pdf" | "png_preview",
): string {
  const filename = artifactType === "pdf" ? "certificate.pdf" : "certificate.png";
  return `certificates/${certificateNumber}/${templateVersion}/${filename}`;
}
