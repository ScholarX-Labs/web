import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { EmailEventType, EmailProviderName } from "@/domain/email/contracts/email-types";
import { DrizzleEmailDeliveryRepository } from "@/domain/email/infrastructure/db/drizzle-email-delivery.repository";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ provider: string }>;
};

type ProviderEventBody = {
  providerEventId?: string;
  providerMessageId?: string;
  deliveryId?: string;
  eventType?: EmailEventType;
  occurredAt?: string;
  reasonCategory?: string;
  safeDetails?: string;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { provider: providerParam } = await context.params;
  if (providerParam !== "primary" && providerParam !== "gmail_fallback") {
    return error("UNSUPPORTED_PROVIDER", "Unsupported provider", 400);
  }

  const rawBody = await request.text();
  if (!verifyWebhook(request, rawBody)) {
    return error("INVALID_SIGNATURE", "Webhook verification failed", 401);
  }

  let body: ProviderEventBody;
  try {
    body = JSON.parse(rawBody) as ProviderEventBody;
  } catch {
    return error("INVALID_PAYLOAD", "Invalid webhook payload", 400);
  }

  if (!body.deliveryId || !body.eventType || !body.occurredAt) {
    return error("EVENT_NOT_LINKED", "Provider event could not be linked", 202);
  }

  await new DrizzleEmailDeliveryRepository().appendEvent({
    deliveryId: body.deliveryId,
    provider: providerParam as EmailProviderName,
    providerEventId: body.providerEventId,
    providerMessageId: body.providerMessageId,
    eventType: body.eventType,
    occurredAt: new Date(body.occurredAt),
    receivedAt: new Date(),
    reasonCategory: body.reasonCategory as never,
    safeDetails: body.safeDetails,
  });

  return NextResponse.json({ ok: true, data: { accepted: true } });
}

function verifyWebhook(request: NextRequest, body: string): boolean {
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!secret) return false;

  const signature = request.headers.get("x-email-signature");
  if (!signature) return false;

  const expectedHex = createHmac("sha256", secret).update(body).digest("hex");
  const normalizedSignature = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(normalizedSignature, "hex");
  if (expected.length !== actual.length) return false;

  return timingSafeEqual(expected, actual) && body.length <= 256_000;
}

function error(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}
