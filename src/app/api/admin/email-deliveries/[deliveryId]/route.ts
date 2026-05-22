import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { maskEmailAddress } from "@/domain/email/application/email-sanitization";
import { DrizzleEmailDeliveryRepository } from "@/domain/email/infrastructure/db/drizzle-email-delivery.repository";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ deliveryId: string }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Admin access is required" } },
      { status: 401 },
    );
  }

  const params = await context.params;
  const deliveryId = typeof params.deliveryId === "string" ? params.deliveryId.trim() : "";
  if (!UUID_PATTERN.test(deliveryId)) {
    return NextResponse.json(
      { ok: false, error: { code: "INVALID_REQUEST", message: "Invalid email delivery id" } },
      { status: 400 },
    );
  }

  const detail = await new DrizzleEmailDeliveryRepository().findById(deliveryId);
  if (!detail) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Email delivery not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: detail.id,
      requestId: detail.requestId,
      category: detail.category,
      status: detail.status,
      recipientMasked: maskEmailAddress(detail.recipientEmail),
      subjectHash: detail.subjectHash,
      acceptedProvider: detail.acceptedProvider,
      providerMessageId: detail.providerMessageId,
      failureCategory: detail.failureCategory,
      createdAt: detail.createdAt.toISOString(),
      updatedAt: detail.updatedAt.toISOString(),
      attempts: detail.attempts.map((attempt) => ({
        attemptNumber: attempt.attemptNumber,
        provider: attempt.provider,
        status: attempt.status,
        failureCategory: attempt.failureCategory,
        startedAt: attempt.startedAt.toISOString(),
        finishedAt: attempt.finishedAt?.toISOString() ?? null,
      })),
      events: detail.events.map((event) => ({
        provider: event.provider,
        eventType: event.eventType,
        occurredAt: event.occurredAt.toISOString(),
        receivedAt: event.receivedAt.toISOString(),
        reasonCategory: event.reasonCategory,
      })),
    },
  });
}
