import type { ArtifactStatus } from "../domain/certificate-artifact-status";
import type { ArtifactType, StorageProvider } from "@/db/schema/certificates-db.schema";

// ---------------------------------------------------------------------------
// Application-level artifact record
// ---------------------------------------------------------------------------

export interface CertificateArtifactRecord {
  id: string;
  certificateId: string;
  artifactType: ArtifactType;
  templateVersion: string;
  status: ArtifactStatus;
  storageProvider: StorageProvider;
  storageContainer: string | null;
  storageKey: string | null;
  contentType: string | null;
  byteSize: number | null;
  checksumSha256: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  attempts: number;
  nextAttemptAt: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactKey {
  certificateId: string;
  artifactType: ArtifactType;
  templateVersion: string;
}

export interface CreateArtifactInput {
  certificateId: string;
  artifactType: ArtifactType;
  templateVersion: string;
  storageProvider?: StorageProvider;
}

export interface MarkGeneratingInput {
  artifactId: string;
}

export interface MarkReadyInput {
  artifactId: string;
  storageContainer: string;
  storageKey: string;
  contentType: string;
  byteSize: number;
  checksumSha256: string;
  generatedAt: Date;
}

export interface MarkFailedInput {
  artifactId: string;
  errorCode: string;
  errorMessage: string;
  nextAttemptAt?: Date;
}

export interface MarkPendingForRegenerationInput {
  artifactId: string;
  reasonCode: string;
  reasonMessage: string;
}

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface ICertificateArtifactRepository {
  findRequiredArtifact(key: ArtifactKey): Promise<CertificateArtifactRecord | null>;
  /** Look up a single artifact row by its primary key. */
  findById(artifactId: string): Promise<CertificateArtifactRecord | null>;
  createPending(input: CreateArtifactInput): Promise<CertificateArtifactRecord>;
  /**
   * Atomically claim an artifact for generation.
   * Updates status from pending/failed → generating only if conditions are met.
   * Returns the updated row or null if the artifact was already claimed/ready.
   */
  markGenerating(input: MarkGeneratingInput): Promise<CertificateArtifactRecord | null>;
  markPendingForRegeneration(
    input: MarkPendingForRegenerationInput,
  ): Promise<CertificateArtifactRecord | null>;
  markReady(input: MarkReadyInput): Promise<void>;
  markFailed(input: MarkFailedInput): Promise<void>;
}
