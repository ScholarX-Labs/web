import { randomUUID } from "node:crypto";
import { EmailDeliveryService } from "@/domain/email/application/email-delivery.service";
import type { EmailDeliveryRepository } from "@/domain/email/contracts/email-delivery.repository";
import type { EmailServiceConfig } from "@/domain/email/contracts/email-types";

export type EmailWorkerDrainResult = {
  workerId: string;
  claimed: number;
  accepted: number;
  failed: number;
  retryScheduled: number;
  repaired: number;
  released: number;
};

export async function drainEmailDeliveries(input?: {
  workerId?: string;
  config?: EmailServiceConfig;
  repository?: EmailDeliveryRepository;
  service?: EmailDeliveryService;
  now?: Date;
}): Promise<EmailWorkerDrainResult> {
  const config =
    input?.config ??
    (await import("@/domain/email/infrastructure/email-config")).loadEmailServiceConfigFromEnv();
  const repository =
    input?.repository ??
    new (await import("@/domain/email/infrastructure/db/drizzle-email-delivery.repository"))
      .DrizzleEmailDeliveryRepository();
  const service =
    input?.service ??
    (await import("@/domain/email/factory/email-service.factory"))
      .createDefaultEmailDeliveryService();
  const now = input?.now ?? new Date();
  const workerId = input?.workerId ?? `email-worker:${randomUUID()}`;

  const [repaired, released] = await Promise.all([
    repository.repairAcceptedAttemptOrphans({ now, limit: config.workerBatchSize }),
    repository.releaseExpiredLeases({ now, limit: config.workerBatchSize }),
  ]);

  const claimed = await repository.claimRetryableBatch({
    workerId,
    lockedUntil: new Date(now.getTime() + config.workerLeaseSeconds * 1000),
    limit: config.workerBatchSize,
    now,
  });

  let accepted = 0;
  let failed = 0;
  let retryScheduled = 0;

  for (const delivery of claimed) {
    const result = await service.processClaimedDelivery(delivery);
    if (result.ok) {
      accepted += 1;
    } else if (result.status === "retry_scheduled") {
      retryScheduled += 1;
    } else {
      failed += 1;
    }
  }

  return {
    workerId,
    claimed: claimed.length,
    accepted,
    failed,
    retryScheduled,
    repaired,
    released,
  };
}
