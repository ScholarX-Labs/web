import type { ICertificateQueuePort, CertificateQueueMessage } from "../../contracts/certificate-queue.port";

/**
 * NoopCertificateQueueAdapter — used in local development and tests.
 * Silently discards all publish calls without failing.
 */
export class NoopCertificateQueueAdapter implements ICertificateQueuePort {
  private readonly published: CertificateQueueMessage[] = [];

  async publish(message: CertificateQueueMessage): Promise<void> {
    this.published.push(message);
    if (process.env.NODE_ENV !== "production") {
      console.debug("[NoopCertificateQueue] Enqueued (noop):", message.messageId);
    }
  }

  /** Test helper — inspect published messages */
  getPublished(): readonly CertificateQueueMessage[] {
    return this.published;
  }
}
