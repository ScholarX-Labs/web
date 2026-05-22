// ---------------------------------------------------------------------------
// Certificate event record
// ---------------------------------------------------------------------------

export type CertificateEventType =
  | "certificate.issued"
  | "certificate.claimed"
  | "certificate.revoked"
  | "certificate.artifact_generation_requested"
  | "certificate.artifact_generation_started"
  | "certificate.artifact_ready"
  | "certificate.artifact_failed"
  | "certificate.downloaded"
  | "certificate.verified"
  | "certificate.migrated";

export interface CertificateEventRecord {
  id: string;
  certificateId: string;
  eventType: CertificateEventType;
  actorId: string | null;
  actorRole: string | null;
  ipRegion: string | null;
  userAgentHash: string | null;
  metadata: Record<string, unknown>;
  occurredAt: string;
}

export interface AppendEventInput {
  certificateId: string;
  eventType: CertificateEventType;
  actorId?: string;
  actorRole?: string;
  ipRegion?: string;
  userAgentHash?: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface ICertificateEventRepository {
  append(input: AppendEventInput): Promise<CertificateEventRecord>;
}
