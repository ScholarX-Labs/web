import { db } from "@/db";
import { dbCertificateEvents } from "@/db/schema/certificates-db.schema";
import type {
  ICertificateEventRepository,
  CertificateEventRecord,
  AppendEventInput,
  CertificateEventType,
} from "../../contracts/certificate-event.repository";

export class DrizzleCertificateEventRepository
  implements ICertificateEventRepository
{
  async append(
    input: AppendEventInput,
  ): Promise<CertificateEventRecord> {
    const rows = await db
      .insert(dbCertificateEvents)
      .values({
        certificateId: input.certificateId,
        eventType: input.eventType,
        actorId: input.actorId,
        actorRole: input.actorRole,
        ipRegion: input.ipRegion,
        userAgentHash: input.userAgentHash,
        metadata: input.metadata ?? {},
      })
      .returning();

    const row = rows[0];
    if (!row) throw new Error("Failed to append certificate event");

    return {
      id: row.id,
      certificateId: row.certificateId,
      eventType: row.eventType as CertificateEventType,
      actorId: row.actorId,
      actorRole: row.actorRole,
      ipRegion: row.ipRegion,
      userAgentHash: row.userAgentHash,
      metadata: (row.metadata as Record<string, unknown>) ?? {},
      occurredAt: row.occurredAt.toISOString(),
    };
  }
}
