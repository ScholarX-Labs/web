/**
 * Certificate source types and the eligibility snapshot passed from
 * the course domain into the certificate domain.
 *
 * The course domain computes eligibility; the certificate domain only
 * receives the approved snapshot. This preserves the Dependency Inversion
 * Principle: course completion rules never leak into certificate issuance.
 */

export type CertificateSourceType =
  | "course_completion"
  | "admin_award"
  | "program_completion";

export type CompletionSource =
  | "live"
  | "backfill_approximate"
  | "legacy_migration"
  | "admin_override";

/**
 * Immutable snapshot of completion facts passed from the courses domain.
 * Must not contain live course/user data that could change after issuance.
 */
export interface CertificateEligibilitySnapshot {
  sourceType: CertificateSourceType;
  /** course_progress.id for course_completion */
  sourceId: string;
  userId: string;
  /** course_id stored as reporting metadata only */
  courseId?: string;
  recipientName: string;
  recipientEmail?: string;
  programName: string;
  completedAt: Date;
  completionSource: CompletionSource;
  ruleVersion: string;
}
