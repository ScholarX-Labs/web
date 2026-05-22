/**
 * AzureServiceBusCertificateQueueAdapter
 *
 * Wraps the Azure Service Bus SDK behind ICertificateQueuePort.
 * Loaded ONLY by the worker process — never imported from Next.js bundles.
 */
import type {
  ICertificateQueuePort,
  CertificateQueueMessage,
} from "../../contracts/certificate-queue.port";
import { CertificateError } from "../../domain/certificate-errors";

export const CERTIFICATE_QUEUE_NAME = "certificate-artifact-generation";

export class AzureServiceBusCertificateQueueAdapter
  implements ICertificateQueuePort
{
  private readonly connectionString: string;
  private readonly queueName: string;

  constructor(connectionString?: string, queueName?: string) {
    const cs =
      connectionString ?? process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
    if (!cs) {
      throw new CertificateError(
        "INTERNAL_ERROR",
        500,
        "AZURE_SERVICE_BUS_CONNECTION_STRING is not configured.",
      );
    }
    this.connectionString = cs;
    this.queueName = queueName ?? CERTIFICATE_QUEUE_NAME;
  }

  async publish(message: CertificateQueueMessage): Promise<void> {
    // Lazy import keeps Azure SDK out of the Next.js bundle
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- @azure/service-bus is installed in the worker container, not the web bundle
    const { ServiceBusClient } = await import("@azure/service-bus");
    const sbClient = new ServiceBusClient(this.connectionString);
    const sender = sbClient.createSender(this.queueName);

    try {
      await sender.sendMessages({
        messageId: message.messageId,
        body: message.body,
        contentType: "application/json",
        // Azure Service Bus duplicate detection window must be enabled on the queue
      });
    } finally {
      await sender.close();
      await sbClient.close();
    }
  }
}
