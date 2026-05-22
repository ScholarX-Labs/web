import type { OutboxStatus } from "@/db/schema/certificates-db.schema";

// ---------------------------------------------------------------------------
// Outbox record
// ---------------------------------------------------------------------------

export interface CertificateQueueOutboxRecord {
  id: string;
  artifactId: string;
  certificateId: string;
  messageId: string;
  queueName: string;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  publishedAt: string | null;
  nextAttemptAt: string | null;
  createdAt: string;
}

export interface CreateOutboxRowInput {
  artifactId: string;
  certificateId: string;
  messageId: string;
  queueName?: string;
}

export interface MarkOutboxPublishedInput {
  outboxId: string;
  publishedAt: Date;
}

export interface UnpublishedOutboxRow {
  id: string;
  artifactId: string;
  certificateId: string;
  messageId: string;
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface ICertificateQueueRepository {
  createOutboxRow(input: CreateOutboxRowInput): Promise<CertificateQueueOutboxRecord>;
  markPublished(input: MarkOutboxPublishedInput): Promise<void>;
  findUnpublished(olderThanMs: number, limit: number): Promise<UnpublishedOutboxRow[]>;
}
