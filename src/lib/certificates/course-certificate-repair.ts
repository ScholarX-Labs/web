import "server-only";

import { ROUTES } from "@/lib/routes";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import { createCourseProgressDomain } from "@/domain/courses";
import type { LearnerCertificateLinkDto } from "@/domain/certificates/application/certificate-verification-query.service";

interface EnsureCourseCertificateInput {
  userId: string;
  courseId: string;
  courseTitle: string;
  recipientName: string;
  recipientEmail?: string | null;
}

const toCertificateLink = (input: {
  certificateNumber: string;
  issuedAt: string;
  status: string;
  courseTitle: string;
}): LearnerCertificateLinkDto => ({
  certificateNumber: input.certificateNumber,
  certificateUrl: ROUTES.CERTIFICATE_DETAIL(input.certificateNumber),
  courseTitle: input.courseTitle,
  issuedAt: input.issuedAt,
  status: input.status,
});

/**
 * Server-side guard for course and lesson pages.
 *
 * If a learner has completed a course but the canonical certificate is missing,
 * repair the state by issuing it idempotently. Issuance creates the pending PDF
 * artifact, durable outbox row, and Service Bus message for worker generation.
 */
export async function ensureCourseCompletionCertificate(
  input: EnsureCourseCertificateInput,
): Promise<LearnerCertificateLinkDto | null> {
  const progressDomain = createCourseProgressDomain();
  const progress = await progressDomain.progressQuery.getCourseProgress(
    input.userId,
    input.courseId,
  );

  if (
    !progress ||
    progress.status !== "completed" ||
    !progress.completedAt ||
    !progress.certificateEligibleAt
  ) {
    return null;
  }

  const certDomain = createCertificateDomain();
  const existing =
    await certDomain.verificationQuery.getCourseCompletionCertificateForUser({
      userId: input.userId,
      courseProgressId: progress.id,
    });

  if (existing) return existing;

  const result = await certDomain.issueService.issueForCourseCompletion({
    userId: input.userId,
    courseId: input.courseId,
    courseProgressId: progress.id,
    completedAt: new Date(progress.completedAt!),
    recipientName: input.recipientName,
    recipientEmail: input.recipientEmail ?? undefined,
    courseTitle: input.courseTitle,
    completionSource: progress.completedByBackfill
      ? "backfill_approximate"
      : "live",
    ruleVersion: progress.ruleVersion ?? "course_completion_v1",
  });

  return toCertificateLink({
    certificateNumber: result.certificate.certificateNumber,
    issuedAt: result.certificate.issuedAt,
    status: result.certificate.status,
    courseTitle: result.certificate.programName,
  });
}

export async function repairCourseCompletionCertificateArtifactsByNumber(
  certificateNumber: string,
): Promise<void> {
  const certDomain = createCertificateDomain();
  const certificate =
    await certDomain.verificationQuery.getInternalCertificate(certificateNumber);

  if (
    !certificate ||
    certificate.revokedAt ||
    certificate.sourceType !== "course_completion" ||
    !certificate.courseId ||
    !certificate.courseProgressId
  ) {
    return;
  }

  await certDomain.issueService.issueForCourseCompletion({
    userId: certificate.userId,
    courseId: certificate.courseId,
    courseProgressId: certificate.courseProgressId,
    completedAt: new Date(certificate.completionDate),
    recipientName: certificate.recipientName,
    recipientEmail: certificate.recipientEmail ?? undefined,
    courseTitle: certificate.programName,
    completionSource: certificate.completionSource,
    ruleVersion: certificate.ruleVersion,
  });
}
