import type { CertificateStatus } from "../domain/certificate-status";
import type { CertificateSourceType, CompletionSource } from "../domain/certificate-source";

// ---------------------------------------------------------------------------
// Application-level record types (no Drizzle / DB types escape this boundary)
// ---------------------------------------------------------------------------

export interface CertificateRecord {
  id: string;
  certificateNumber: string;
  shortId: string | null;
  userId: string;
  recipientName: string;
  recipientEmail: string | null;
  sourceType: CertificateSourceType;
  sourceId: string | null;
  courseId: string | null;
  courseProgressId: string | null;
  programName: string;
  completionDate: string; // ISO
  status: CertificateStatus;
  issuedAt: string; // ISO
  claimedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  isPublic: boolean;
  metadata: Record<string, unknown>;
  ruleVersion: string;
  completionSource: CompletionSource;
}

export interface CertificateSourceKey {
  userId: string;
  sourceType: CertificateSourceType;
  sourceId: string;
}

export interface CreateCertificateInput {
  certificateNumber: string;
  userId: string;
  recipientName: string;
  recipientEmail?: string;
  sourceType: CertificateSourceType;
  sourceId: string;
  courseId?: string;
  courseProgressId?: string;
  programName: string;
  completionDate: Date;
  ruleVersion: string;
  completionSource: CompletionSource;
  metadata?: Record<string, unknown>;
}

export interface RevokeCertificateInput {
  certificateId: string;
  revokedBy: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface ICertificateRepository {
  findByPublicNumber(certificateNumber: string): Promise<CertificateRecord | null>;
  findBySource(key: CertificateSourceKey): Promise<CertificateRecord | null>;
  createIssued(input: CreateCertificateInput): Promise<CertificateRecord>;
  markRevoked(input: RevokeCertificateInput): Promise<CertificateRecord>;
}
