import type {
  UserCertificateDto,
  CertificateVerificationResult,
} from "../contracts";
import type {
  CertificateUserRow,
  CertificateVerificationRow,
} from "../infrastructure/db/next-certificates.repository";

export function toUserCertificateDto(
  row: CertificateUserRow,
): UserCertificateDto {
  return {
    completionId: row.completion.id,
    courseId: row.completion.courseId,
    courseTitle: row.courseTitle,
    courseImageUrl: row.courseImageUrl,
    completedAt: row.completion.completedAt.toISOString(),
    completedLessons: row.completion.completedLessons,
    completionPercentage: row.completion.completionPercentage,
    certificateId: row.completion.certificateId!,
  };
}

export function toValidVerificationResult(
  row: CertificateVerificationRow,
): CertificateVerificationResult {
  return {
    valid: true,
    certificateId: row.completion.certificateId!,
    studentName: row.studentName ?? "",
    courseName: row.courseTitle,
    completedAt: row.completion.completedAt.toISOString(),
    completionPercentage: row.completion.completionPercentage,
  };
}
