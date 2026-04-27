import { db } from "@/db";
import { eq } from "drizzle-orm";
import type {
  VerifyCertificateInput,
  VerifyCertificateResult,
} from "@/domain/certificates/contracts";
import { CertificateSigningService } from "./certificate-signing.service";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { dbCertificates } from "@/domain/certificates/infrastructure/db/certificates-db.schema";
import { dbCourses } from "@/domain/courses/infrastructure/db/courses-db.schema";

/**
 * CertificateVerificationService
 *
 * Public verification flow:
 * 1. Fetch certificate from DB by ID
 * 2. Recompute HMAC-SHA256 over canonical payload
 * 3. Compare with stored signature using timingSafeEqual
 * 4. Return VALID / REVOKED / INVALID with full context
 * 5. Log "verified" event asynchronously (non-blocking)
 */
export class CertificateVerificationService {
  private readonly signer: CertificateSigningService;
  private readonly certRepo: CertificatesRepository;

  constructor(options?: {
    signer?: CertificateSigningService;
    certRepo?: CertificatesRepository;
  }) {
    this.signer = options?.signer ?? new CertificateSigningService();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.certRepo = options?.certRepo ?? new CertificatesRepository(db as any);
  }

  async verify(
    input: VerifyCertificateInput,
  ): Promise<VerifyCertificateResult> {
    // Fetch raw row directly to access signatureHex (intentionally omitted from DTO)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any)
      .select()
      .from(dbCertificates)
      .where(eq(dbCertificates.id, input.certificateId))
      .limit(1);

    const cert = rows[0] ?? null;

    if (!cert) {
      return {
        status: "INVALID",
        message:
          "No certificate found with this ID. It may not exist or the link may be incorrect.",
      };
    }

    if (cert.status === "REVOKED") {
      // Log asynchronously
      void this.certRepo.logEvent({
        certificateId: cert.id as string,
        eventType: "verified",
        actorRole: "public",
        ipRegion: input.ipRegion,
        userAgentHash: input.userAgentHash,
        metadata: { result: "REVOKED" },
      });

      return {
        status: "REVOKED",
        message:
          "This certificate has been revoked by ScholarX. Please contact support for more information.",
      };
    }

    // Recompute signature
    const payload = this.signer.buildPayload({
      certificateId: cert.id as string,
      recipientEmail: cert.recipientEmail as string,
      recipientName: cert.recipientName as string,
      courseId: cert.courseId as string,
      seasonNumber: cert.seasonNumber as number,
      role: cert.role as "mentee" | "mentor",
      issuedAt: cert.issuedAt as Date,
    });

    const isValid = this.signer.verify(payload, cert.signatureHex as string);

    if (!isValid) {
      void this.certRepo.logEvent({
        certificateId: cert.id as string,
        eventType: "verified",
        actorRole: "public",
        ipRegion: input.ipRegion,
        userAgentHash: input.userAgentHash,
        metadata: { result: "INVALID", reason: "signature_mismatch" },
      });

      return {
        status: "INVALID",
        message:
          "This certificate could not be verified — the data may have been tampered with.",
      };
    }

    // Fetch program context from Courses domain
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const courseRows = await (db as any)
      .select({
        duration: dbCourses.duration,
        tags: dbCourses.tags,
        slug: dbCourses.slug,
        instructorId: dbCourses.instructorId,
      })
      .from(dbCourses)
      .where(eq(dbCourses.id, cert.courseId))
      .limit(1);

    const course = courseRows[0] ?? null;
    const skillTags: string[] = Array.isArray(course?.tags) ? course.tags : [];

    // Log verification event asynchronously
    void this.certRepo.logEvent({
      certificateId: cert.id as string,
      eventType: "verified",
      actorRole: "public",
      ipRegion: input.ipRegion,
      userAgentHash: input.userAgentHash,
      metadata: { result: "VALID" },
    });

    return {
      status: "VALID",
      message: "This certificate is authentic and has been verified by ScholarX.",
      certificate: {
        shortId: cert.shortId as string,
        recipientName: cert.recipientName as string,
        role: cert.role as "mentee" | "mentor",
        programName: cert.programName as string,
        seasonNumber: cert.seasonNumber as number,
        completionDate: cert.completionDate as Date,
        issuedAt: cert.issuedAt as Date,
        signatureFingerprint: (cert.signatureHex as string).slice(0, 16),
        programDuration: course?.duration ?? null,
        skillTags,
        instructorName: null,
        courseSlug: course?.slug ?? null,
      },
    };
  }
}
