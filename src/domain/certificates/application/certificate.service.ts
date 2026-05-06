import { join } from "path";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { NextCertificatesRepository } from "../infrastructure/db/next-certificates.repository";
import {
  UserCertificateDto,
  CertificateVerificationResult,
  CertificatePdfData,
} from "../contracts";
import {
  toUserCertificateDto,
  toValidVerificationResult,
} from "./certificate.mappers";

// Certificate ID regex — V2 format only: CERT-<UUID v4>
const CERT_ID_REGEX =
  /^CERT-[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

const FRONTEND_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://scholar-x.org";

/** Template bytes cached in memory after first disk read */
let _templateCache: Uint8Array | null = null;

function getTemplateBytes(): Uint8Array {
  if (!_templateCache) {
    const templatePath = join(
      process.cwd(),
      "public/assets/certificate-template.pdf",
    );
    _templateCache = readFileSync(templatePath);
  }
  return _templateCache;
}

export class NextCertificateService {
  constructor(private readonly repo: NextCertificatesRepository) {}

  /** Generate a new unique certificateId */
  generateCertificateId(): string {
    return `CERT-${randomUUID().toUpperCase()}`;
  }

  /** All certificates for an authenticated user */
  async getUserCertificates(userId: string): Promise<UserCertificateDto[]> {
    const rows = await this.repo.findByUser(userId);
    return rows
      .filter((r) => r.completion.certificateId !== null)
      .map(toUserCertificateDto);
  }

  /** Public certificate verification — three distinct result states */
  async verifyCertificate(
    certificateId: string,
  ): Promise<CertificateVerificationResult> {
    // 1. Fast-fail on invalid format — no DB hit
    if (!CERT_ID_REGEX.test(certificateId)) {
      return { valid: false, certificateId };
    }

    // 2. DB lookup
    const row = await this.repo.findByCertificateId(certificateId);
    if (!row) {
      return { valid: false, certificateId };
    }

    // 3. Valid
    return toValidVerificationResult(row);
  }

  /**
   * Generate PDF for an authenticated user's certificate.
   * Returns null if the user has no completed certificate for this course.
   */
  async generatePdf(userId: string, courseId: string): Promise<Buffer | null> {
    const row = await this.repo.findByUserAndCourse(userId, courseId);
    if (!row || !row.completion.certificateId) return null;

    const data: CertificatePdfData = {
      studentName: row.studentName ?? "",
      courseName: row.courseTitle,
      completedAt: row.completion.completedAt,
      certificateId: row.completion.certificateId,
      completionPercentage: row.completion.completionPercentage,
      verificationUrl: `${FRONTEND_URL}/certificates/verify/${row.completion.certificateId}`,
    };

    return this.buildPdf(data);
  }

  /** Build PDF bytes from template + dynamic text overlays */
  private async buildPdf(data: CertificatePdfData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(getTemplateBytes());
    const page = pdfDoc.getPages()[0];
    const { width, height } = page.getSize();

    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Student name — centered, prominent
    const nameSize = 28;
    const nameW = bold.widthOfTextAtSize(data.studentName, nameSize);
    page.drawText(data.studentName, {
      x: (width - nameW) / 2,
      y: height * 0.5,
      size: nameSize,
      font: bold,
      color: rgb(0.353, 0.361, 0.42),
    });

    // Completion date
    const dateStr = new Date(data.completedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const dateW = regular.widthOfTextAtSize(dateStr, 10);
    page.drawText(dateStr, {
      x: (width - dateW) / 2 + 26,
      y: height * 0.14,
      size: 10,
      font: regular,
      color: rgb(0.451, 0.451, 0.451),
    });

    // Certificate ID
    const certText = `Certificate ID: ${data.certificateId}`;
    const certW = regular.widthOfTextAtSize(certText, 8);
    page.drawText(certText, {
      x: (width - certW) / 2,
      y: height * 0.07,
      size: 8,
      font: regular,
      color: rgb(0.627, 0.627, 0.627),
    });

    return Buffer.from(await pdfDoc.save());
  }
}
