import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * CertificateStorageService
 *
 * Handles upload and pre-signed URL generation for certificate assets (PDF + PNG).
 * Works with both AWS S3 and Cloudflare R2 (via endpoint override).
 * Files are stored at: certificates/{certificateId}/cert.pdf  and  .../cert.png
 */
export class CertificateStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const bucket = process.env.CERT_STORAGE_BUCKET;
    if (!bucket) throw new Error("CERT_STORAGE_BUCKET is not set");

    const endpoint = process.env.CERT_STORAGE_ENDPOINT;

    this.bucket = bucket;
    this.client = new S3Client({
      region: "auto",
      ...(endpoint ? { endpoint } : {}),
      credentials: {
        accessKeyId: process.env.CERT_STORAGE_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.CERT_STORAGE_SECRET_ACCESS_KEY ?? "",
      },
      // Cloudflare R2 requires path-style for presigned URLs
      forcePathStyle: !!endpoint,
    });
  }

  /** Upload a buffer to the given storage key. */
  async upload(
    key: string,
    buffer: Buffer,
    contentType: "application/pdf" | "image/png",
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Non-guessable key + time-limited URL = effective access control
        ACL: "private",
      }),
    );
  }

  /**
   * Generate a pre-signed URL for the given storage key.
   * Default TTL = 900 seconds (15 minutes).
   */
  async getPresignedUrl(key: string, ttlSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
  }

  /** Build the canonical storage key for a certificate's PDF asset. */
  pdfKey(certificateId: string): string {
    return `certificates/${certificateId}/cert.pdf`;
  }

  /** Build the canonical storage key for a certificate's PNG asset. */
  pngKey(certificateId: string): string {
    return `certificates/${certificateId}/cert.png`;
  }

  /** Delete both assets for a certificate (e.g., on GDPR erasure). */
  async deleteAssets(certificateId: string): Promise<void> {
    await Promise.all([
      this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.pdfKey(certificateId),
        }),
      ),
      this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.pngKey(certificateId),
        }),
      ),
    ]);
  }
}
