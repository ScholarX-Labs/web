/**
 * Queue port — abstracts Azure Service Bus, BullMQ, or a no-op.
 * Application services depend only on this interface.
 */

export interface CertificateQueueMessage {
  /** Unique message ID for Service Bus duplicate detection */
  messageId: string;
  /** JSON-serializable message body */
  body: CertificateArtifactJobMessage;
}

export interface CertificateArtifactJobMessage {
  schemaVersion: 1;
  artifactId: string;
  certificateId: string;
  certificateNumber: string;
  artifactType: "pdf" | "png_preview";
  templateVersion: string;
  requestedAt: string; // ISO
}

export interface ICertificateQueuePort {
  publish(message: CertificateQueueMessage): Promise<void>;
}
