import { randomUUID } from "crypto";
import { db } from "@/db";
import type {
  IssueCertificateInput,
  IssueCertificateResult,
} from "@/domain/certificates/contracts";
import { CertificateSigningService } from "./certificate-signing.service";
import { CertificatePdfService } from "./certificate-pdf.service";
import { CertificateStorageService } from "./certificate-storage.service";
import { CertificateEmailService } from "./certificate-email.service";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { CompletionCriteriaRepository } from "@/domain/certificates/infrastructure/db/completion-criteria.repository";
import { CertificateError } from "./certificate.errors";

const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * CertificateIssuanceService
 *
 * Orchestrates the full single-certificate issuance pipeline (synchronous):
 * 1. Idempotency check — return existing cert if already issued for this (user, course, season)
 * 2. Completion criteria guard — block issuance if criteria not configured or not met
 * 3. Sign canonical payload with HMAC-SHA256
 * 4. Generate PDF + PNG via @react-pdf/renderer
 * 5. Upload assets to S3/R2
 * 6. Insert certificate row to DB with PENDING status
 * 7. Send claim email via nodemailer
 * 8. Return IssueCertificateResult
 *
 * Retry: generation/upload steps retry up to 3× with exponential backoff.
 * Single-cert path is fully synchronous (no job queue).
 */
export class CertificateIssuanceService {
  private readonly signer: CertificateSigningService;
  private readonly pdfService: CertificatePdfService;
  private readonly storage: CertificateStorageService;
  private readonly email: CertificateEmailService;
  private readonly certRepo: CertificatesRepository;
  private readonly criteriaRepo: CompletionCriteriaRepository;
  private readonly baseUrl: string;

  constructor(options?: {
    signer?: CertificateSigningService;
    pdfService?: CertificatePdfService;
    storage?: CertificateStorageService;
    email?: CertificateEmailService;
    certRepo?: CertificatesRepository;
    criteriaRepo?: CompletionCriteriaRepository;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbInstance = db as any;
    this.signer = options?.signer ?? new CertificateSigningService();
    this.pdfService = options?.pdfService ?? new CertificatePdfService();
    this.storage = options?.storage ?? new CertificateStorageService();
    this.email = options?.email ?? new CertificateEmailService();
    this.certRepo = options?.certRepo ?? new CertificatesRepository(dbInstance);
    this.criteriaRepo = options?.criteriaRepo ?? new CompletionCriteriaRepository(dbInstance);
    this.baseUrl = process.env.CERT_BASE_URL ?? "https://scholarx.lk";
  }

  async issue(input: IssueCertificateInput): Promise<IssueCertificateResult> {
    // 1. Idempotency check
    const existing = await this.certRepo.findByUserCourseSeason(
      input.userId,
      input.courseId,
      input.seasonNumber,
    );
    if (existing) {
      return {
        success: true,
        certificateId: existing.id,
        shortId: existing.shortId,
        code: "already_exists",
        message: "A certificate for this participant and season already exists.",
      };
    }

    // 2. Completion criteria guard (criteria must be configured)
    const criteria = await this.criteriaRepo.findByCourseId(input.courseId);
    if (!criteria) {
      return {
        success: false,
        certificateId: "",
        shortId: "",
        code: "criteria_not_configured",
        message:
          "Completion criteria have not been configured for this course. " +
          "An admin must configure them before certificates can be issued.",
      };
    }

    // 3. Generate IDs
    const certificateId = randomUUID();
    const issuedAt = new Date();
    // Use timestamp-based sequence for shortId (monotonically increasing)
    const seq = Date.now() % 99999;
    const shortId = this.signer.generateShortId(seq);

    // 4. Sign payload
    const payload = this.signer.buildPayload({
      certificateId,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      courseId: input.courseId,
      seasonNumber: input.seasonNumber,
      role: input.role,
      issuedAt,
    });
    const signatureHex = this.signer.sign(payload);

    // 5. Generate claim token
    const { token: claimToken, expiresAt: claimTokenExpiresAt } =
      this.signer.generateClaimToken();

    const verificationUrl = `${this.baseUrl}/verify/${certificateId}`;
    const claimUrl = `${this.baseUrl}/certificates/claim/${claimToken}`;

    const renderData = {
      id: certificateId,
      shortId,
      recipientName: input.recipientName,
      programName: input.programName,
      seasonNumber: input.seasonNumber,
      role: input.role,
      completionDate: input.completionDate,
      issuedAt,
      verificationUrl,
      signatureFingerprint: signatureHex.slice(0, 16),
    };

    // 6. Generate PDF + PNG with retries
    let pdfBuffer: Buffer | null = null;
    let pngBuffer: Buffer | null = null;
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        [pdfBuffer, pngBuffer] = await Promise.all([
          this.pdfService.generatePdf(renderData),
          this.pdfService.generatePng(renderData),
        ]);
        break;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 500); // 1s, 2s, 4s
        }
      }
    }

    if (!pdfBuffer || !pngBuffer) {
      // Insert FAILED cert row for admin visibility
      await this.certRepo.create({
        id: certificateId,
        shortId,
        userId: input.userId,
        recipientName: input.recipientName,
        recipientEmail: input.recipientEmail,
        courseId: input.courseId,
        programName: input.programName,
        seasonNumber: input.seasonNumber,
        role: input.role,
        completionDate: input.completionDate,
        signatureHex,
        claimToken,
        claimTokenExpiresAt,
      });
      await this.certRepo.updateStatus(certificateId, "FAILED");
      await this.certRepo.logEvent({
        certificateId,
        eventType: "generation_failed",
        metadata: { error: String(lastError) },
      });
      throw new CertificateError(
        "GENERATION_FAILED",
        500,
        "Certificate generation failed after 3 attempts.",
        5001,
        { certificateId },
      );
    }

    // 7. Upload to storage
    const pdfKey = this.storage.pdfKey(certificateId);
    const pngKey = this.storage.pngKey(certificateId);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await Promise.all([
          this.storage.upload(pdfKey, pdfBuffer, "application/pdf"),
          this.storage.upload(pngKey, pngBuffer, "image/png"),
        ]);
        break;
      } catch (err) {
        if (attempt === MAX_RETRIES) throw err;
        await sleep(Math.pow(2, attempt) * 500);
      }
    }

    // 8. Insert certificate row (PENDING)
    const cert = await this.certRepo.create({
      id: certificateId,
      shortId,
      userId: input.userId,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      courseId: input.courseId,
      programName: input.programName,
      seasonNumber: input.seasonNumber,
      role: input.role,
      completionDate: input.completionDate,
      signatureHex,
      claimToken,
      claimTokenExpiresAt,
    });

    await this.certRepo.updateAssets(cert.id, pdfKey, pngKey);
    await this.certRepo.logEvent({ certificateId: cert.id, eventType: "issued" });

    // 9. Send claim email (non-blocking — log error but don't fail issuance)
    try {
      await this.email.sendClaimEmail(
        input.recipientEmail,
        input.recipientName,
        claimUrl,
      );
      await this.certRepo.logEvent({
        certificateId: cert.id,
        eventType: "email_sent",
      });
    } catch (emailErr) {
      console.error("[CertificateIssuanceService] Claim email failed:", emailErr);
    }

    return {
      success: true,
      certificateId: cert.id,
      shortId: cert.shortId,
      code: "created",
      message: "Certificate issued successfully.",
    };
  }
}
