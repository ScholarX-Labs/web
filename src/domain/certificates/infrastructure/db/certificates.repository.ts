import { eq, and, desc, count, isNotNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import {
  dbCertificates,
  dbCertificateEvents,
} from "@/domain/certificates/infrastructure/db/certificates-db.schema";
import type {
  CertificateDTO,
  CertificateListQuery,
  CertificateStatus,
  CertificateEventType,
} from "@/domain/certificates/contracts";

type DbClient = PostgresJsDatabase<Record<string, unknown>>;

function mapToDTO(
  row: typeof dbCertificates.$inferSelect,
): CertificateDTO {
  return {
    id: row.id,
    shortId: row.shortId,
    userId: row.userId,
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    courseId: row.courseId,
    programName: row.programName,
    seasonNumber: row.seasonNumber,
    role: row.role as CertificateDTO["role"],
    completionDate: row.completionDate,
    status: row.status as CertificateStatus,
    issuedAt: row.issuedAt,
    claimedAt: row.claimedAt,
    revokedAt: row.revokedAt,
    revokedReason: row.revokedReason,
    pdfStorageKey: row.pdfStorageKey,
    pngStorageKey: row.pngStorageKey,
    isPublic: row.isPublic,
  };
}

export class CertificatesRepository {
  constructor(private readonly db: DbClient) {}

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  async findById(id: string): Promise<CertificateDTO | null> {
    const rows = await this.db
      .select()
      .from(dbCertificates)
      .where(eq(dbCertificates.id, id))
      .limit(1);
    return rows[0] ? mapToDTO(rows[0]) : null;
  }

  async findByShortId(shortId: string): Promise<CertificateDTO | null> {
    const rows = await this.db
      .select()
      .from(dbCertificates)
      .where(eq(dbCertificates.shortId, shortId))
      .limit(1);
    return rows[0] ? mapToDTO(rows[0]) : null;
  }

  async findByClaimToken(
    token: string,
  ): Promise<(typeof dbCertificates.$inferSelect) | null> {
    const rows = await this.db
      .select()
      .from(dbCertificates)
      .where(eq(dbCertificates.claimToken, token))
      .limit(1);
    return rows[0] ?? null;
  }

  /** Idempotency check — returns existing cert if (user, course, season) already issued */
  async findByUserCourseSeason(
    userId: string,
    courseId: string,
    seasonNumber: number,
  ): Promise<CertificateDTO | null> {
    const rows = await this.db
      .select()
      .from(dbCertificates)
      .where(
        and(
          eq(dbCertificates.userId, userId),
          eq(dbCertificates.courseId, courseId),
          eq(dbCertificates.seasonNumber, seasonNumber),
        ),
      )
      .limit(1);
    return rows[0] ? mapToDTO(rows[0]) : null;
  }

  async listByUserId(userId: string): Promise<CertificateDTO[]> {
    const rows = await this.db
      .select()
      .from(dbCertificates)
      .where(eq(dbCertificates.userId, userId))
      .orderBy(desc(dbCertificates.issuedAt));
    return rows.map(mapToDTO);
  }

  async listPublicByUserId(userId: string): Promise<CertificateDTO[]> {
    const rows = await this.db
      .select()
      .from(dbCertificates)
      .where(
        and(
          eq(dbCertificates.userId, userId),
          eq(dbCertificates.isPublic, true),
        ),
      )
      .orderBy(desc(dbCertificates.issuedAt));
    return rows.map(mapToDTO);
  }

  async list(
    query: CertificateListQuery,
  ): Promise<{ items: CertificateDTO[]; total: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (query.courseId) conditions.push(eq(dbCertificates.courseId, query.courseId));
    if (query.seasonNumber !== undefined)
      conditions.push(eq(dbCertificates.seasonNumber, query.seasonNumber));
    if (query.status) conditions.push(eq(dbCertificates.status, query.status));
    if (query.role) conditions.push(eq(dbCertificates.role, query.role));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      this.db
        .select()
        .from(dbCertificates)
        .where(whereClause)
        .orderBy(desc(dbCertificates.issuedAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: count() })
        .from(dbCertificates)
        .where(whereClause),
    ]);

    return {
      items: rows.map(mapToDTO),
      total: countRows[0]?.count ?? 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Writes
  // ---------------------------------------------------------------------------

  async create(data: {
    id: string;
    shortId: string;
    userId: string;
    recipientName: string;
    recipientEmail: string;
    courseId: string;
    programName: string;
    seasonNumber: number;
    role: string;
    completionDate: Date;
    signatureHex: string;
    claimToken: string;
    claimTokenExpiresAt: Date;
  }): Promise<CertificateDTO> {
    const rows = await this.db
      .insert(dbCertificates)
      .values({
        ...data,
        status: "PENDING",
      })
      .returning();
    if (!rows[0]) throw new Error("Failed to insert certificate");
    return mapToDTO(rows[0]);
  }

  async updateStatus(id: string, status: CertificateStatus): Promise<void> {
    await this.db
      .update(dbCertificates)
      .set({ status, updatedAt: new Date() })
      .where(eq(dbCertificates.id, id));
  }

  async updateAssets(
    id: string,
    pdfStorageKey: string,
    pngStorageKey: string,
  ): Promise<void> {
    await this.db
      .update(dbCertificates)
      .set({ pdfStorageKey, pngStorageKey, updatedAt: new Date() })
      .where(eq(dbCertificates.id, id));
  }

  async markClaimed(id: string, userId?: string): Promise<void> {
    await this.db
      .update(dbCertificates)
      .set({
        status: "CLAIMED",
        claimedAt: new Date(),
        claimToken: null,
        claimTokenExpiresAt: null,
        userId: userId ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(dbCertificates.id, id));
  }

  async markRevoked(
    id: string,
    adminUserId: string,
    reason: string,
  ): Promise<void> {
    await this.db
      .update(dbCertificates)
      .set({
        status: "REVOKED",
        revokedAt: new Date(),
        revokedReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(dbCertificates.id, id));
    void adminUserId; // logged in event separately
  }

  async updateVisibility(id: string, isPublic: boolean): Promise<void> {
    await this.db
      .update(dbCertificates)
      .set({ isPublic, updatedAt: new Date() })
      .where(eq(dbCertificates.id, id));
  }

  async refreshClaimToken(
    id: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.db
      .update(dbCertificates)
      .set({ claimToken: token, claimTokenExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(dbCertificates.id, id));
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  async logEvent(data: {
    certificateId: string;
    eventType: CertificateEventType;
    actorId?: string;
    actorRole?: string;
    ipRegion?: string;
    userAgentHash?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.insert(dbCertificateEvents).values({
      certificateId: data.certificateId,
      eventType: data.eventType,
      actorId: data.actorId,
      actorRole: data.actorRole,
      ipRegion: data.ipRegion,
      userAgentHash: data.userAgentHash,
      metadata: data.metadata,
    });
  }
}
