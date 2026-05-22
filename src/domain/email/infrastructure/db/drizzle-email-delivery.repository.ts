import { and, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import {
  dbEmailDeliveries,
  dbEmailDeliveryAttempts,
  dbEmailDeliveryEvents,
} from "@/db/schema/email-db.schema";
import type { EmailDeliveryRepository } from "../../contracts/email-delivery.repository";
import type {
  AppendDeliveryEventInput,
  CreateAttemptInput,
  CreateDeliveryInput,
  EmailDeliveryAttemptRecord,
  EmailDeliveryDetail,
  EmailDeliveryEventRecord,
  EmailDeliveryRecord,
  FinishAttemptAndMarkAcceptedInput,
  FinishAttemptInput,
  MarkFailedInput,
  ScheduleRetryInput,
} from "../../contracts/email-types";

type DeliveryRow = typeof dbEmailDeliveries.$inferSelect;
type AttemptRow = typeof dbEmailDeliveryAttempts.$inferSelect;
type EventRow = typeof dbEmailDeliveryEvents.$inferSelect;

export class DrizzleEmailDeliveryRepository implements EmailDeliveryRepository {
  async createOrReuseDelivery(input: CreateDeliveryInput): Promise<EmailDeliveryRecord> {
    const existing = await this.findByIdempotency(
      input.request.category,
      input.request.idempotencyKey,
    );
    if (existing) return existing;

    try {
      const rows = await db
        .insert(dbEmailDeliveries)
        .values({
          requestId: input.request.requestId ?? randomUUID(),
          idempotencyKey: input.request.idempotencyKey,
          category: input.request.category,
          status: "queued",
          recipientEmail: input.normalizedRecipient,
          recipientHash: input.recipientHash,
          senderIdentity: input.from,
          subjectHash: input.subjectHash,
          subjectPreview: input.subjectPreview,
          bodyStorageMode: "stored",
          textBody: input.request.text,
          htmlBody: input.request.html ?? null,
          replyTo: input.request.replyTo ?? null,
          requestedByUserId: input.request.requestedByUserId ?? null,
          requestedBySystem: input.request.requestedBySystem ?? null,
          metadata: input.request.metadata ?? {},
          createdAt: input.now,
          updatedAt: input.now,
        })
        .returning();

      const row = rows[0];
      if (!row) throw new Error("Failed to create email delivery");
      return mapDelivery(row);
    } catch (error) {
      const reused = await this.findByIdempotency(
        input.request.category,
        input.request.idempotencyKey,
      );
      if (reused) return reused;
      throw error;
    }
  }

  async claimDeliveryForSending(input: {
    deliveryId: string;
    workerId: string;
    lockedUntil: Date;
    expectedStateVersion?: number;
  }): Promise<EmailDeliveryRecord | null> {
    const now = new Date();
    const conditions = [
      eq(dbEmailDeliveries.id, input.deliveryId),
      or(
        inArray(dbEmailDeliveries.status, ["queued", "retry_scheduled"]),
        and(
          eq(dbEmailDeliveries.status, "sending"),
          lte(dbEmailDeliveries.lockedUntil, now),
        ),
        and(eq(dbEmailDeliveries.status, "sending"), isNull(dbEmailDeliveries.lockedUntil)),
      ),
    ];

    if (input.expectedStateVersion !== undefined) {
      conditions.push(eq(dbEmailDeliveries.stateVersion, input.expectedStateVersion));
    }

    const rows = await db
      .update(dbEmailDeliveries)
      .set({
        status: "sending",
        lockedBy: input.workerId,
        lockedAt: now,
        lockedUntil: input.lockedUntil,
        updatedAt: now,
        stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
      })
      .where(and(...conditions))
      .returning();

    return rows[0] ? mapDelivery(rows[0]) : null;
  }

  async claimRetryableBatch(input: {
    workerId: string;
    lockedUntil: Date;
    limit: number;
    now: Date;
  }): Promise<EmailDeliveryRecord[]> {
    const candidates = await db
      .select({
        id: dbEmailDeliveries.id,
        stateVersion: dbEmailDeliveries.stateVersion,
      })
      .from(dbEmailDeliveries)
      .where(
        and(
          inArray(dbEmailDeliveries.status, ["queued", "retry_scheduled", "sending"]),
          or(isNull(dbEmailDeliveries.nextAttemptAt), lte(dbEmailDeliveries.nextAttemptAt, input.now)),
          or(isNull(dbEmailDeliveries.lockedUntil), lte(dbEmailDeliveries.lockedUntil, input.now)),
        ),
      )
      .limit(input.limit);

    const claimed: EmailDeliveryRecord[] = [];
    for (const candidate of candidates) {
      const row = await this.claimDeliveryForSending({
        deliveryId: candidate.id,
        workerId: input.workerId,
        lockedUntil: input.lockedUntil,
        expectedStateVersion: candidate.stateVersion,
      });
      if (row) claimed.push(row);
    }
    return claimed;
  }

  async createAttempt(input: CreateAttemptInput): Promise<EmailDeliveryAttemptRecord> {
    const rows = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(dbEmailDeliveryAttempts)
        .values({
          deliveryId: input.deliveryId,
          attemptNumber: input.attemptNumber,
          provider: input.provider,
          status: "started",
          startedAt: input.startedAt,
        })
        .returning();

      await tx
        .update(dbEmailDeliveries)
        .set({
          attemptCount: input.attemptNumber,
          updatedAt: input.startedAt,
          stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
        })
        .where(eq(dbEmailDeliveries.id, input.deliveryId));

      return inserted;
    });

    const row = rows[0];
    if (!row) throw new Error("Failed to create email delivery attempt");
    return mapAttempt(row);
  }

  async finishAttempt(input: FinishAttemptInput): Promise<void> {
    await db
      .update(dbEmailDeliveryAttempts)
      .set({
        status: input.status,
        finishedAt: input.finishedAt,
        providerMessageId: input.providerMessageId ?? null,
        failureCategory: input.failureCategory ?? null,
        failureReason: input.failureReason ?? null,
        latencyMs: input.latencyMs ?? null,
      })
      .where(eq(dbEmailDeliveryAttempts.id, input.attemptId));
  }

  async finishAttemptAndMarkAccepted(
    input: FinishAttemptAndMarkAcceptedInput,
  ): Promise<EmailDeliveryRecord> {
    const rows = await db.transaction(async (tx) => {
      await tx
        .update(dbEmailDeliveryAttempts)
        .set({
          status: "accepted",
          finishedAt: input.finishedAt,
          providerMessageId: input.providerMessageId ?? null,
          latencyMs: input.latencyMs ?? null,
        })
        .where(eq(dbEmailDeliveryAttempts.id, input.attemptId));

      return tx
        .update(dbEmailDeliveries)
        .set({
          status: "accepted",
          acceptedProvider: input.provider,
          providerMessageId: input.providerMessageId ?? null,
          acceptedAt: input.acceptedAt,
          lockedBy: null,
          lockedAt: null,
          lockedUntil: null,
          updatedAt: input.finishedAt,
          stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
        })
        .where(eq(dbEmailDeliveries.id, input.deliveryId))
        .returning();
    });

    const row = rows[0];
    if (!row) throw new Error("Failed to mark email delivery accepted");
    return mapDelivery(row);
  }

  async markFailed(input: MarkFailedInput): Promise<EmailDeliveryRecord> {
    const rows = await db
      .update(dbEmailDeliveries)
      .set({
        status: "failed",
        failureCategory: input.failureCategory,
        failureReason: input.failureReason,
        failedAt: input.failedAt,
        lockedBy: null,
        lockedAt: null,
        lockedUntil: null,
        updatedAt: input.failedAt,
        stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
      })
      .where(eq(dbEmailDeliveries.id, input.deliveryId))
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to mark email delivery failed");
    return mapDelivery(row);
  }

  async scheduleRetry(input: ScheduleRetryInput): Promise<EmailDeliveryRecord> {
    const rows = await db
      .update(dbEmailDeliveries)
      .set({
        status: "retry_scheduled",
        failureCategory: input.failureCategory,
        failureReason: input.failureReason,
        nextAttemptAt: input.nextAttemptAt,
        lockedBy: null,
        lockedAt: null,
        lockedUntil: null,
        updatedAt: input.now,
        stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
      })
      .where(eq(dbEmailDeliveries.id, input.deliveryId))
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to schedule email delivery retry");
    return mapDelivery(row);
  }

  async appendEvent(input: AppendDeliveryEventInput): Promise<void> {
    await db
      .insert(dbEmailDeliveryEvents)
      .values({
        deliveryId: input.deliveryId,
        provider: input.provider ?? null,
        providerEventId: input.providerEventId ?? null,
        providerMessageId: input.providerMessageId ?? null,
        eventType: input.eventType,
        occurredAt: input.occurredAt,
        receivedAt: input.receivedAt,
        reasonCategory: input.reasonCategory ?? null,
        safeDetails: input.safeDetails ?? null,
      })
      .onConflictDoNothing();

    if (["delivered", "bounced", "complained"].includes(input.eventType)) {
      await db
        .update(dbEmailDeliveries)
        .set({
          status: input.eventType as "delivered" | "bounced" | "complained",
          updatedAt: input.receivedAt,
          stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
        })
        .where(eq(dbEmailDeliveries.id, input.deliveryId));
    }
  }

  async findByRequestId(requestId: string): Promise<EmailDeliveryDetail | null> {
    const rows = await db
      .select()
      .from(dbEmailDeliveries)
      .where(eq(dbEmailDeliveries.requestId, requestId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return this.detailForRow(row);
  }

  async findById(deliveryId: string): Promise<EmailDeliveryDetail | null> {
    const rows = await db
      .select()
      .from(dbEmailDeliveries)
      .where(eq(dbEmailDeliveries.id, deliveryId))
      .limit(1);
    return rows[0] ? this.detailForRow(rows[0]) : null;
  }

  async list(input: {
    status?: string;
    category?: string;
    page: number;
    limit: number;
  }): Promise<{ items: EmailDeliveryRecord[]; total: number }> {
    const where = and(
      input.status ? eq(dbEmailDeliveries.status, input.status as never) : undefined,
      input.category ? eq(dbEmailDeliveries.category, input.category as never) : undefined,
    );

    const rows = await db
      .select()
      .from(dbEmailDeliveries)
      .where(where)
      .limit(input.limit)
      .offset((input.page - 1) * input.limit);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dbEmailDeliveries)
      .where(where);

    return {
      items: rows.map(mapDelivery),
      total: Number(countRow?.count ?? 0),
    };
  }

  async repairAcceptedAttemptOrphans(input: { now: Date; limit: number }): Promise<number> {
    const attempts = await db
      .select()
      .from(dbEmailDeliveryAttempts)
      .where(eq(dbEmailDeliveryAttempts.status, "accepted"))
      .limit(input.limit);

    let repaired = 0;
    for (const attempt of attempts) {
      const rows = await db
        .update(dbEmailDeliveries)
        .set({
          status: "accepted",
          acceptedProvider: attempt.provider,
          providerMessageId: attempt.providerMessageId,
          acceptedAt: attempt.finishedAt ?? input.now,
          lockedBy: null,
          lockedAt: null,
          lockedUntil: null,
          updatedAt: input.now,
          stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
        })
        .where(
          and(
            eq(dbEmailDeliveries.id, attempt.deliveryId),
            eq(dbEmailDeliveries.status, "sending"),
          ),
        )
        .returning({ id: dbEmailDeliveries.id });
      repaired += rows.length;
    }

    return repaired;
  }

  async releaseExpiredLeases(input: { now: Date; limit: number }): Promise<number> {
    const rows = await db
      .update(dbEmailDeliveries)
      .set({
        status: "retry_scheduled",
        lockedBy: null,
        lockedAt: null,
        lockedUntil: null,
        updatedAt: input.now,
        stateVersion: sql`${dbEmailDeliveries.stateVersion} + 1`,
      })
      .where(
        and(
          eq(dbEmailDeliveries.status, "sending"),
          lte(dbEmailDeliveries.lockedUntil, input.now),
        ),
      )
      .returning({ id: dbEmailDeliveries.id });

    return rows.slice(0, input.limit).length;
  }

  private async findByIdempotency(
    category: string,
    idempotencyKey: string,
  ): Promise<EmailDeliveryRecord | null> {
    const rows = await db
      .select()
      .from(dbEmailDeliveries)
      .where(
        and(
          eq(dbEmailDeliveries.category, category as never),
          eq(dbEmailDeliveries.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    return rows[0] ? mapDelivery(rows[0]) : null;
  }

  private async detailForRow(row: DeliveryRow): Promise<EmailDeliveryDetail> {
    const [attempts, events] = await Promise.all([
      db
        .select()
        .from(dbEmailDeliveryAttempts)
        .where(eq(dbEmailDeliveryAttempts.deliveryId, row.id)),
      db
        .select()
        .from(dbEmailDeliveryEvents)
        .where(eq(dbEmailDeliveryEvents.deliveryId, row.id)),
    ]);

    return {
      ...mapDelivery(row),
      attempts: attempts.map(mapAttempt),
      events: events.map(mapEvent),
    };
  }
}

function mapDelivery(row: DeliveryRow): EmailDeliveryRecord {
  return {
    id: row.id,
    requestId: row.requestId,
    idempotencyKey: row.idempotencyKey,
    category: row.category,
    status: row.status,
    recipientEmail: row.recipientEmail,
    recipientHash: row.recipientHash,
    senderIdentity: row.senderIdentity,
    subjectHash: row.subjectHash,
    subjectPreview: row.subjectPreview,
    bodyStorageMode: row.bodyStorageMode,
    bodyReference: row.bodyReference,
    text: row.textBody,
    html: row.htmlBody,
    replyTo: row.replyTo,
    acceptedProvider: row.acceptedProvider,
    providerMessageId: row.providerMessageId,
    failureCategory: row.failureCategory,
    failureReason: row.failureReason,
    requestedByUserId: row.requestedByUserId,
    requestedBySystem: row.requestedBySystem,
    metadata: row.metadata ?? {},
    nextAttemptAt: row.nextAttemptAt,
    attemptCount: row.attemptCount,
    lockedBy: row.lockedBy,
    lockedAt: row.lockedAt,
    lockedUntil: row.lockedUntil,
    stateVersion: row.stateVersion,
    batchId: row.batchId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    acceptedAt: row.acceptedAt,
    failedAt: row.failedAt,
  };
}

function mapAttempt(row: AttemptRow): EmailDeliveryAttemptRecord {
  return {
    id: row.id,
    deliveryId: row.deliveryId,
    attemptNumber: row.attemptNumber,
    provider: row.provider,
    status: row.status,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt,
    providerMessageId: row.providerMessageId,
    failureCategory: row.failureCategory,
    failureReason: row.failureReason,
    latencyMs: row.latencyMs,
  };
}

function mapEvent(row: EventRow): EmailDeliveryEventRecord {
  return {
    id: row.id,
    deliveryId: row.deliveryId,
    provider: row.provider,
    providerEventId: row.providerEventId,
    providerMessageId: row.providerMessageId,
    eventType: row.eventType,
    occurredAt: row.occurredAt,
    receivedAt: row.receivedAt,
    reasonCategory: row.reasonCategory,
    safeDetails: row.safeDetails,
  };
}
