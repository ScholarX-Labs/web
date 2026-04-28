import { db } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import type {
  CertificateListQuery,
  RevokeCertificateInput,
  ResendClaimEmailInput,
  BulkIssueSeasonInput,
  BulkIssueJobDTO,
} from "@/domain/certificates/contracts";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { CertificateEmailService } from "./certificate-email.service";
import { CertificateSigningService } from "./certificate-signing.service";
import { CertificateError } from "./certificate.errors";
import {
  dbCertificateJobs,
  dbCertificates,
} from "@/domain/certificates/infrastructure/db/certificates-db.schema";
import { dbSubscriptions } from "@/domain/courses/infrastructure/db/courses-db.schema";
import { randomUUID } from "crypto";

const BASE_URL = process.env.CERT_BASE_URL ?? "https://scholarx.lk";

/**
 * CertificateAdminService
 *
 * Admin operations: list, revoke, resend claim email, bulk issue, CSV export.
 */
export class CertificateAdminService {
  private readonly certRepo: CertificatesRepository;
  private readonly email: CertificateEmailService;
  private readonly signer: CertificateSigningService;

  constructor(options?: {
    certRepo?: CertificatesRepository;
    email?: CertificateEmailService;
    signer?: CertificateSigningService;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbInstance = db as any;
    this.certRepo = options?.certRepo ?? new CertificatesRepository(dbInstance);
    this.email = options?.email ?? new CertificateEmailService();
    this.signer = options?.signer ?? new CertificateSigningService();
  }

  async list(query: CertificateListQuery) {
    return this.certRepo.list(query);
  }

  async revoke(input: RevokeCertificateInput): Promise<void> {
    const cert = await this.certRepo.findById(input.certificateId);
    if (!cert) {
      throw new CertificateError("NOT_FOUND", 404, "Certificate not found.", 4040);
    }
    if (cert.status === "REVOKED") {
      throw new CertificateError(
        "ALREADY_REVOKED",
        409,
        "Certificate is already revoked.",
        4090,
      );
    }
    await this.certRepo.markRevoked(cert.id, input.adminUserId, input.reason);
    await this.certRepo.logEvent({
      certificateId: cert.id,
      eventType: "revoked",
      actorId: input.adminUserId,
      actorRole: "admin",
      metadata: { reason: input.reason },
    });
  }

  async resendClaimEmail(input: ResendClaimEmailInput): Promise<void> {
    const cert = await this.certRepo.findById(input.certificateId);
    if (!cert) {
      throw new CertificateError("NOT_FOUND", 404, "Certificate not found.", 4040);
    }
    if (cert.status === "CLAIMED") {
      throw new CertificateError(
        "ALREADY_CLAIMED",
        409,
        "Certificate has already been claimed — no email needed.",
        4091,
      );
    }

    // Generate a fresh claim token
    const { token, expiresAt } = this.signer.generateClaimToken();
    await this.certRepo.refreshClaimToken(cert.id, token, expiresAt);

    const claimUrl = `${BASE_URL}/certificates/claim/${token}`;
    await this.email.sendClaimEmail(cert.recipientEmail, cert.recipientName, claimUrl);
    await this.certRepo.logEvent({
      certificateId: cert.id,
      eventType: "email_resent",
      actorId: input.adminUserId,
      actorRole: "admin",
    });
  }

  async bulkIssue(input: BulkIssueSeasonInput): Promise<BulkIssueJobDTO> {
    // Count qualifying enrolled participants
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrolledRows = await (db as any)
      .select({ userId: dbSubscriptions.userId })
      .from(dbSubscriptions)
      .where(
        and(
          eq(dbSubscriptions.courseId, input.courseId),
          eq(dbSubscriptions.isActive, true),
        ),
      );

    const totalCount = enrolledRows.length;
    const jobId = randomUUID();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(dbCertificateJobs).values({
      id: jobId,
      courseId: input.courseId,
      seasonNumber: input.seasonNumber,
      triggeredBy: input.triggeredByUserId,
      status: "PENDING",
      totalCount,
      processedCount: 0,
      failedCount: 0,
    });

    return {
      jobId,
      status: "PENDING",
      totalCount,
      processedCount: 0,
      failedCount: 0,
      startedAt: null,
      completedAt: null,
    };
  }

  async getBulkJobStatus(jobId: string): Promise<BulkIssueJobDTO | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any)
      .select()
      .from(dbCertificateJobs)
      .where(eq(dbCertificateJobs.id, jobId))
      .limit(1);

    const job = rows[0];
    if (!job) return null;

    return {
      jobId: job.id as string,
      status: job.status as BulkIssueJobDTO["status"],
      totalCount: job.totalCount as number,
      processedCount: job.processedCount as number,
      failedCount: job.failedCount as number,
      startedAt: job.startedAt as Date | null,
      completedAt: job.completedAt as Date | null,
    };
  }

  async exportCsv(query: CertificateListQuery): Promise<string> {
    const { items } = await this.certRepo.list({ ...query, limit: 10000 });
    const header =
      "id,shortId,recipientName,recipientEmail,courseId,programName,seasonNumber,role,status,issuedAt,claimedAt,revokedAt";
    const rows = items.map((c) =>
      [
        c.id,
        c.shortId,
        `"${c.recipientName.replace(/"/g, '""')}"`,
        c.recipientEmail,
        c.courseId,
        `"${c.programName.replace(/"/g, '""')}"`,
        c.seasonNumber,
        c.role,
        c.status,
        c.issuedAt.toISOString(),
        c.claimedAt?.toISOString() ?? "",
        c.revokedAt?.toISOString() ?? "",
      ].join(","),
    );
    return [header, ...rows].join("\n");
  }
}
