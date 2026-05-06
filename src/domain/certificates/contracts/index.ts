/** Returned by getUserCertificates() Server Action */
export interface UserCertificateDto {
  completionId: string;
  courseId: string;
  courseTitle: string;
  courseImageUrl: string | null;
  completedAt: string; // ISO 8601 — safe to serialize across RSC boundary
  completedLessons: number;
  completionPercentage: number;
  certificateId: string;
}

/** Returned by verifyCertificate() Server Action */
export interface CertificateVerificationResult {
  valid: boolean;
  certificateId: string;
  studentName?: string; // only present when valid === true
  courseName?: string;
  completedAt?: string;
  completionPercentage?: number;
}

/** Internal — passed to the PDF builder only */
export interface CertificatePdfData {
  studentName: string;
  courseName: string;
  completedAt: Date;
  certificateId: string;
  completionPercentage: number;
  verificationUrl: string;
}
