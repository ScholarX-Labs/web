/**
 * Certificate Domain Contracts
 *
 * TypeScript interfaces defining the public surface of the Certification Module.
 * These contracts are the boundary between the domain and the rest of the application.
 * All external consumers (route handlers, server actions, other domains) MUST
 * interact with the Certification Module exclusively through these interfaces.
 *
 * Pattern mirrors: src/domain/courses/contracts/
 */

// ---------------------------------------------------------------------------
// Shared Value Types
// ---------------------------------------------------------------------------

export type CertificateRole = "mentee" | "mentor";

export type CertificateStatus = "PENDING" | "CLAIMED" | "REVOKED" | "FAILED";

export type CertificateEventType =
  | "issued"
  | "claimed"
  | "viewed"
  | "verified"
  | "shared"
  | "downloaded"
  | "revoked"
  | "email_sent"
  | "email_resent"
  | "generation_failed"
  | "generation_retried";

export type BulkJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

// ---------------------------------------------------------------------------
// Certificate DTO (read-side, returned from queries)
// ---------------------------------------------------------------------------

export interface CertificateDTO {
  id: string;
  shortId: string;
  userId: string | null;
  recipientName: string;
  recipientEmail: string;
  courseId: string;
  programName: string;
  seasonNumber: number;
  role: CertificateRole;
  completionDate: Date;
  status: CertificateStatus;
  issuedAt: Date;
  claimedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  pdfStorageKey: string | null;
  pngStorageKey: string | null;
  isPublic: boolean;
}

// ---------------------------------------------------------------------------
// Issuance Contracts
// ---------------------------------------------------------------------------

/** Input for issuing a single certificate (admin manual or event-triggered). */
export interface IssueCertificateInput {
  userId: string;
  recipientName: string;
  recipientEmail: string;
  courseId: string;
  programName: string;
  seasonNumber: number;
  role: CertificateRole;
  completionDate: Date;
}

export interface IssueCertificateResult {
  success: boolean;
  certificateId: string;
  shortId: string;
  /** "created" — new cert issued. "already_exists" — idempotent, cert already existed. */
  code: "created" | "already_exists" | "completion_criteria_not_met" | "criteria_not_configured";
  message: string;
}

// ---------------------------------------------------------------------------
// Bulk Issuance Contracts
// ---------------------------------------------------------------------------

export interface BulkIssueSeasonInput {
  courseId: string;
  seasonNumber: number;
  triggeredByUserId: string;
}

export interface BulkIssueJobDTO {
  jobId: string;
  status: BulkJobStatus;
  totalCount: number;
  processedCount: number;
  failedCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Claim Contracts
// ---------------------------------------------------------------------------

export interface ClaimCertificateInput {
  claimToken: string;
  /** Optional: if provided, links the certificate to this user's wallet. */
  userId?: string;
}

export interface ClaimCertificateResult {
  success: boolean;
  code: "claimed" | "already_claimed" | "token_expired" | "token_invalid";
  certificateId?: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Verification Contracts
// ---------------------------------------------------------------------------

export interface VerifyCertificateInput {
  certificateId: string;
  /** Anonymized IP region for logging (e.g. country code "LK"). */
  ipRegion?: string;
  userAgentHash?: string;
}

export interface VerifyCertificateResult {
  status: "VALID" | "REVOKED" | "INVALID";
  certificate?: {
    shortId: string;
    recipientName: string;
    role: CertificateRole;
    programName: string;
    seasonNumber: number;
    completionDate: Date;
    issuedAt: Date;
    signatureFingerprint: string; // First 16 chars of signatureHex
    // Program metadata (read from courses domain)
    programDuration: string | null;
    skillTags: string[];
    instructorName: string | null;
    courseSlug: string | null;
  };
  message: string;
}

// ---------------------------------------------------------------------------
// Admin Contracts
// ---------------------------------------------------------------------------

export interface CertificateListQuery {
  courseId?: string;
  seasonNumber?: number;
  status?: CertificateStatus;
  role?: CertificateRole;
  page?: number;
  limit?: number;
}

export interface RevokeCertificateInput {
  certificateId: string;
  adminUserId: string;
  reason: string;
}

export interface ResendClaimEmailInput {
  certificateId: string;
  adminUserId: string;
}

// ---------------------------------------------------------------------------
// Portfolio Contracts
// ---------------------------------------------------------------------------

export interface SetPortfolioUsernameInput {
  userId: string;
  username: string;
  enabled: boolean;
}

export interface PublicPortfolioDTO {
  username: string;
  recipientName: string;
  certificates: Array<{
    id: string;
    shortId: string;
    programName: string;
    seasonNumber: number;
    role: CertificateRole;
    issuedAt: Date;
    verificationUrl: string;
  }>;
}

// ---------------------------------------------------------------------------
// Gateway Interface (implemented by the application service)
// ---------------------------------------------------------------------------

export interface CertificateGateway {
  issue(input: IssueCertificateInput): Promise<IssueCertificateResult>;
  bulkIssue(input: BulkIssueSeasonInput): Promise<BulkIssueJobDTO>;
  getBulkJobStatus(jobId: string): Promise<BulkIssueJobDTO | null>;
  claim(input: ClaimCertificateInput): Promise<ClaimCertificateResult>;
  verify(input: VerifyCertificateInput): Promise<VerifyCertificateResult>;
  list(query: CertificateListQuery): Promise<{ items: CertificateDTO[]; total: number }>;
  revoke(input: RevokeCertificateInput): Promise<void>;
  resendClaimEmail(input: ResendClaimEmailInput): Promise<void>;
  getPublicPortfolio(username: string): Promise<PublicPortfolioDTO | null>;
  setPortfolioUsername(input: SetPortfolioUsernameInput): Promise<void>;
  toggleCertificateVisibility(certificateId: string, userId: string, isPublic: boolean): Promise<void>;
  getWallet(userId: string): Promise<CertificateDTO[]>;
}

// ---------------------------------------------------------------------------
// Completion Criteria Contracts (Courses → Certificates integration)
// ---------------------------------------------------------------------------

/**
 * Emitted by the Courses domain (NextCourseEnrollmentService) when
 * a participant's completion criteria are evaluated as met.
 * The Certificates domain subscribes to this event via a registered handler.
 */
export interface CourseCompletionEvaluatedEvent {
  userId: string;
  courseId: string;
  programName: string;
  seasonNumber: number;
  role: CertificateRole;
  completionDate: Date;
  recipientName: string;
  recipientEmail: string;
}

export interface CompletionCriteriaDTO {
  courseId: string;
  minWatchPercentage: number;
  quizzesRequired: boolean;
  minQuizScore: number | null;
}
