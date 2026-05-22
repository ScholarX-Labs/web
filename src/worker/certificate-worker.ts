/**
 * Certificate Worker Entrypoint
 *
 * Consumes Azure Service Bus messages for certificate artifact generation.
 *
 * Deployment target: Azure Container Apps worker (or local dev with CERTIFICATE_QUEUE_ADAPTER=noop).
 *
 * Run:
 *   node --import tsx src/worker/certificate-worker.ts
 *
 * Environment:
 *   AZURE_SERVICE_BUS_CONNECTION_STRING — required for production
 *   DATABASE_URL                        — required
 *   CERTIFICATE_RENDERER_ADAPTER=playwright|fake
 *   CERTIFICATE_STORAGE_ADAPTER=azure|memory
 *   CERTIFICATE_QUEUE_ADAPTER=azure|noop
 *   WORKER_CONCURRENCY                  — optional, default 5
 */

import "dotenv/config";
import type { CertificateArtifactJobMessage } from "@/domain/certificates/contracts/certificate-queue.port";
import { createCertificateWorkerDomain } from "@/domain/certificates/factory/certificate-services.factory";

// Local shape matching ServiceBusReceivedMessage fields we actually use
// (full type is in @azure/service-bus — worker-only package)
interface SbReceivedMessage {
  messageId?: string | null;
  body: unknown;
  deliveryCount?: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const QUEUE_NAME = process.env.CERTIFICATE_QUEUE_NAME ?? "certificate-artifact-generation";
const MAX_CONCURRENT_JOBS = parseInt(process.env.WORKER_CONCURRENCY ?? "5", 10);
const LOCK_RENEWAL_INTERVAL_MS = 60_000; // 60 seconds

let isShuttingDown = false;

// ---------------------------------------------------------------------------
// Worker logic
// ---------------------------------------------------------------------------

async function processMessage(
  message: any,
  jobMessage: CertificateArtifactJobMessage,
): Promise<void> {
  const { generationService } = createCertificateWorkerDomain();

  console.info("[CertificateWorker] Processing message", {
    messageId: message.messageId,
    artifactId: jobMessage.artifactId,
    certificateNumber: jobMessage.certificateNumber,
    artifactType: jobMessage.artifactType,
    templateVersion: jobMessage.templateVersion,
  });

  await generationService.processJob(jobMessage);
}

// ---------------------------------------------------------------------------
// Main — connects to Azure Service Bus
// ---------------------------------------------------------------------------

async function main() {
  const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
  if (!connectionString) {
    console.error("[CertificateWorker] AZURE_SERVICE_BUS_CONNECTION_STRING is not set");
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore -- @azure/service-bus is installed in the worker container, not the web bundle
  const { ServiceBusClient } = await import("@azure/service-bus");
  const client = new ServiceBusClient(connectionString);
  const receiver = client.createReceiver(QUEUE_NAME, {
    receiveMode: "peekLock",
  });

  console.info(`[CertificateWorker] Listening on queue "${QUEUE_NAME}" (concurrency=${MAX_CONCURRENT_JOBS})`);

  // Graceful shutdown
  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.info("[CertificateWorker] Shutting down gracefully…");
    await receiver.close();
    await client.close();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Processing loop with bounded concurrency
  const inFlight = new Set<Promise<void>>();

  const processLoop = async () => {
    while (!isShuttingDown) {
      // Wait if at concurrency limit
      if (inFlight.size >= MAX_CONCURRENT_JOBS) {
        await Promise.race(inFlight);
        continue;
      }

      const messages = await receiver.receiveMessages(1, {
        maxWaitTimeInMs: 5_000,
      });

      if (!messages.length) continue;

      const sbMessage = messages[0] as any;

      // Parse the job message body
      let jobMessage: CertificateArtifactJobMessage;
      try {
        const body = typeof sbMessage.body === "string"
          ? JSON.parse(sbMessage.body)
          : sbMessage.body;
        jobMessage = body as CertificateArtifactJobMessage;
      } catch {
        console.error("[CertificateWorker] Failed to parse message body — dead-lettering", {
          messageId: sbMessage.messageId,
        });
        await receiver.deadLetterMessage(sbMessage, {
          deadLetterReason: "PARSE_ERROR",
          deadLetterErrorDescription: "Message body could not be parsed as JSON",
        });
        continue;
      }

      // Start processing — track in-flight promises for concurrency control
      const jobPromise = (async () => {
        // Periodically renew the lock to prevent message timeout during rendering
        const lockRenewalTimer = setInterval(async () => {
          try {
            await receiver.renewMessageLock(sbMessage);
          } catch {
            clearInterval(lockRenewalTimer);
          }
        }, LOCK_RENEWAL_INTERVAL_MS);

        try {
          await processMessage(sbMessage, jobMessage);
          clearInterval(lockRenewalTimer);
          await receiver.completeMessage(sbMessage);
          console.info("[CertificateWorker] Message completed", {
            messageId: sbMessage.messageId,
          });
        } catch (error) {
          clearInterval(lockRenewalTimer);

          const deliveryCount = sbMessage.deliveryCount ?? 0;
          const isDeadLetterEligible = deliveryCount >= 4; // 0-indexed, max 5 attempts

          console.error("[CertificateWorker] Message processing failed", {
            messageId: sbMessage.messageId,
            deliveryCount,
            error: error instanceof Error ? error.message : String(error),
          });

          if (isDeadLetterEligible) {
            await receiver.deadLetterMessage(sbMessage, {
              deadLetterReason: "MAX_RETRIES_EXCEEDED",
              deadLetterErrorDescription:
                error instanceof Error ? error.message : String(error),
            });
          } else {
            // Abandon — Service Bus will redeliver after lock timeout
            await receiver.abandonMessage(sbMessage);
          }
        }
      })();

      // Track in-flight and clean up when done
      inFlight.add(jobPromise);
      jobPromise.finally(() => inFlight.delete(jobPromise));
    }
  };

  await processLoop();
}

main().catch((error) => {
  console.error("[CertificateWorker] Fatal startup error:", error);
  process.exit(1);
});
