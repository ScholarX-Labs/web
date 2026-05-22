import "server-only";
import {
  createLegacyIdempotencyKey,
  maskEmailAddress,
} from "@/domain/email/application/email-sanitization";
import { createDefaultEmailDeliveryService } from "@/domain/email/factory/email-service.factory";
import type { EmailCategory } from "@/domain/email/contracts/email-types";

type EmailProps = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
  replyTo?: string;
  category?: EmailCategory;
  idempotencyKey?: string;
  requestId?: string;
  requestedByUserId?: string;
  requestedBySystem?: string;
  purpose?: string;
};

type SendEmailResult = {
  ok: boolean;
  messageId?: string;
};

async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
  replyTo,
  category = "system_test",
  idempotencyKey,
  requestId,
  requestedByUserId,
  requestedBySystem,
  purpose,
}: EmailProps): Promise<SendEmailResult> {
  try {
    const result = await createDefaultEmailDeliveryService().sendEmail({
      to,
      subject,
      text,
      html,
      from,
      replyTo,
      category,
      requestId,
      requestedByUserId,
      requestedBySystem,
      idempotencyKey:
        idempotencyKey ??
        createLegacyIdempotencyKey({
          category,
          to,
          subject,
          requestId,
          purpose,
        }),
    });

    if (!result.ok) {
      throw new Error(result.message);
    }

    return {
      ok: true,
      messageId: result.providerMessageId,
    };
  } catch (error) {
    console.error("[sendEmail] delivery failed", {
      recipient: maskEmailAddress(to),
      category,
    });

    throw new Error("Email delivery failed", { cause: error });
  }
}

export { sendEmail };
