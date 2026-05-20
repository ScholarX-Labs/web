import { createHmac, randomBytes } from "crypto";
import type {
  CertificateIssueCommand,
  ICertificateRepository,
} from "@/domain/courses/contracts/certificate.repository";
import type {
  CertificateIssueResult,
  CertificateMetadata,
} from "@/domain/courses/contracts/course-progress.types";
import { NextCourseError } from "@/domain/courses/application/next-course.errors";

const CERTIFICATE_TEMPLATE_VERSION = "v1";
const CERTIFICATE_PREFIX = "SX";
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const toBase62 = (bytes: Buffer): string => {
  let value = BigInt(`0x${bytes.toString("hex")}`);
  if (value === BigInt(0)) return "0";

  let encoded = "";
  while (value > 0) {
    const remainder = Number(value % BigInt(62));
    encoded = BASE62[remainder] + encoded;
    value /= BigInt(62);
  }
  return encoded;
};

export class CertificateService {
  constructor(private readonly repository: ICertificateRepository) {}

  getCertificateByUserCourse(userId: string, courseId: string) {
    return this.repository.findCertificateByUserCourse(userId, courseId);
  }

  getCertificateByNumber(certificateNumber: string) {
    return this.repository.findCertificateByNumber(certificateNumber);
  }

  async issueCertificate(
    command: CertificateIssueCommand,
  ): Promise<CertificateIssueResult> {
    const existing = await this.repository.findCertificateByUserCourse(
      command.userId,
      command.courseId,
    );

    if (existing) {
      return { certificate: existing, alreadyIssued: true };
    }

    if (
      command.progress.status !== "completed" ||
      !command.progress.completedAt ||
      !command.progress.certificateEligibleAt
    ) {
      throw new NextCourseError(
        "CERTIFICATE_NOT_ELIGIBLE",
        409,
        "This course is not eligible for certificate issuance yet.",
        9201,
        { courseId: command.courseId },
      );
    }

    const issuedAt = new Date();
    const metadata: CertificateMetadata = {
      learnerDisplayName: command.learnerDisplayName,
      courseTitle: command.courseTitle,
      completionDate: command.progress.completedAt,
      completionSource: command.progress.completedByBackfill
        ? "backfill_approximate"
        : "normal",
      ruleVersion: command.progress.ruleVersion,
      requiredLessonCount: command.progress.requiredLessons,
      certificateTemplateVersion: CERTIFICATE_TEMPLATE_VERSION,
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const certificateNumber = this.generateCertificateNumber({
        userId: command.userId,
        courseId: command.courseId,
        issuedAt,
      });

      try {
        const certificate = await this.repository.createCertificate({
          certificateNumber,
          userId: command.userId,
          courseId: command.courseId,
          courseProgressId: command.progress.id,
          metadata,
        });

        return { certificate, alreadyIssued: false };
      } catch (error) {
        const retryExisting = await this.repository.findCertificateByUserCourse(
          command.userId,
          command.courseId,
        );
        if (retryExisting) {
          return { certificate: retryExisting, alreadyIssued: true };
        }

        if (attempt === 2) throw error;
      }
    }

    throw new NextCourseError(
      "CERTIFICATE_ISSUE_FAILED",
      500,
      "Certificate could not be issued.",
      9202,
    );
  }

  private generateCertificateNumber(params: {
    userId: string;
    courseId: string;
    issuedAt: Date;
  }) {
    const secret =
      process.env.CERTIFICATE_SIGNING_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      "development-certificate-secret";
    const nonce = randomBytes(8).toString("hex");
    const payload = `${params.userId}:${params.courseId}:${params.issuedAt.toISOString()}:${nonce}`;
    const digest = createHmac("sha256", secret).update(payload).digest();
    return `${CERTIFICATE_PREFIX}-${toBase62(digest).slice(0, 12)}`;
  }
}
