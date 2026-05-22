import type {
  ICertificateStoragePort,
  CertificateStorageUploadInput,
  CertificateStorageDownloadUrlInput,
} from "../../contracts/certificate-storage.port";

/**
 * MemoryCertificateStorageAdapter — in-memory storage for tests and local dev.
 * Files are stored as Buffers in a Map keyed by "{container}/{key}".
 */
export class MemoryCertificateStorageAdapter
  implements ICertificateStoragePort
{
  private readonly store = new Map<string, { content: Buffer; contentType: string }>();

  async upload(input: CertificateStorageUploadInput): Promise<void> {
    const mapKey = `${input.container}/${input.key}`;
    this.store.set(mapKey, {
      content: input.content,
      contentType: input.contentType,
    });
  }

  async getDownloadUrl(
    input: CertificateStorageDownloadUrlInput,
  ): Promise<string> {
    const mapKey = `${input.container}/${input.key}`;
    if (!this.store.has(mapKey)) {
      throw new Error(`MemoryStorage: key not found: ${mapKey}`);
    }
    // Return a synthetic local URL
    return `/api/__dev__/certificate-artifact?key=${encodeURIComponent(input.key)}&container=${encodeURIComponent(input.container)}`;
  }

  async delete(key: string, container: string): Promise<void> {
    this.store.delete(`${container}/${key}`);
  }

  /** Test helper — retrieve uploaded content */
  getContent(key: string, container: string): Buffer | undefined {
    return this.store.get(`${container}/${key}`)?.content;
  }
}
