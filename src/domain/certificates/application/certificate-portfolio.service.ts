import { db } from "@/db";
import { eq } from "drizzle-orm";
import type {
  CertificateDTO,
  SetPortfolioUsernameInput,
  PublicPortfolioDTO,
} from "@/domain/certificates/contracts";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { user as dbUsers } from "@/db/schema/auth-schema";
import { CertificateError } from "./certificate.errors";

const USERNAME_REGEX = /^[a-z0-9-]{3,30}$/;
const BASE_URL = process.env.CERT_BASE_URL ?? "https://scholarx.lk";

/**
 * CertificatePortfolioService
 *
 * Handles the public portfolio feature:
 * - Set / validate portfolio username
 * - Toggle per-certificate public visibility
 * - Resolve public portfolio page data
 * - Retrieve authenticated wallet
 */
export class CertificatePortfolioService {
  private readonly certRepo: CertificatesRepository;

  constructor(certRepo?: CertificatesRepository) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.certRepo = certRepo ?? new CertificatesRepository(db as any);
  }

  async getWallet(userId: string): Promise<CertificateDTO[]> {
    return this.certRepo.listByUserId(userId);
  }

  async toggleVisibility(
    certificateId: string,
    userId: string,
    isPublic: boolean,
  ): Promise<void> {
    const cert = await this.certRepo.findById(certificateId);
    if (!cert) {
      throw new CertificateError("NOT_FOUND", 404, "Certificate not found.", 4040);
    }
    if (cert.userId !== userId) {
      throw new CertificateError(
        "FORBIDDEN",
        403,
        "You do not own this certificate.",
        4030,
      );
    }
    await this.certRepo.updateVisibility(certificateId, isPublic);
  }

  async setPortfolioUsername(input: SetPortfolioUsernameInput): Promise<void> {
    if (!USERNAME_REGEX.test(input.username)) {
      throw new CertificateError(
        "INVALID_USERNAME",
        422,
        "Username must be 3–30 characters, lowercase letters, digits, and hyphens only.",
        4220,
      );
    }

    // Check uniqueness
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any)
      .select({ id: dbUsers.id })
      .from(dbUsers)
      .where(eq(dbUsers.portfolioUsername, input.username))
      .limit(1);

    const isTaken =
      existing.length > 0 && existing[0]?.id !== input.userId;
    if (isTaken) {
      throw new CertificateError(
        "USERNAME_TAKEN",
        409,
        "This username is already taken. Please choose a different one.",
        4090,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .update(dbUsers)
      .set({
        portfolioUsername: input.username,
        portfolioEnabled: input.enabled,
        updatedAt: new Date(),
      })
      .where(eq(dbUsers.id, input.userId));
  }

  async getPublicPortfolio(username: string): Promise<PublicPortfolioDTO | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRows = await (db as any)
      .select({
        id: dbUsers.id,
        name: dbUsers.name,
        portfolioEnabled: dbUsers.portfolioEnabled,
      })
      .from(dbUsers)
      .where(eq(dbUsers.portfolioUsername, username))
      .limit(1);

    const user = userRows[0];
    if (!user || !user.portfolioEnabled) return null;

    const certs = await this.certRepo.listPublicByUserId(user.id);

    return {
      username,
      recipientName: user.name as string,
      certificates: certs.map((c) => ({
        id: c.id,
        shortId: c.shortId,
        programName: c.programName,
        seasonNumber: c.seasonNumber,
        role: c.role,
        issuedAt: c.issuedAt,
        verificationUrl: `${BASE_URL}/verify/${c.id}`,
      })),
    };
  }
}
