import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createDefaultEmailDeliveryService } from "@/domain/email/factory/email-service.factory";
import { DrizzleEmailDeliveryRepository } from "@/domain/email/infrastructure/db/drizzle-email-delivery.repository";
import { loadEmailServiceConfigFromEnv } from "@/domain/email/infrastructure/email-config";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ deliveryId: string }>;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_: Request, context: RouteContext) {
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

  const repository = new DrizzleEmailDeliveryRepository();
  const detail = await repository.findById(deliveryId);
  if (!detail) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Email delivery not found" } },
      { status: 404 },
    );
  }

  if (detail.status === "accepted" || detail.status === "delivered") {
    return NextResponse.json(
      { ok: false, error: { code: "RETRY_NOT_ALLOWED", message: "Accepted email cannot be retried" } },
      { status: 409 },
    );
  }

  const now = new Date();
  await repository.scheduleRetry({
    deliveryId,
    failureCategory: detail.failureCategory ?? "unknown",
    failureReason: "manual_retry",
    nextAttemptAt: now,
    now,
  });

  const config = loadEmailServiceConfigFromEnv();
  const claimed = await repository.claimDeliveryForSending({
    deliveryId,
    workerId: `admin-retry:${session.user.id}`,
    lockedUntil: new Date(now.getTime() + config.workerLeaseSeconds * 1000),
  });

  if (!claimed) {
    return NextResponse.json(
      { ok: false, error: { code: "RETRY_NOT_ALLOWED", message: "Email delivery is already claimed" } },
      { status: 409 },
    );
  }

  const result = await createDefaultEmailDeliveryService().processClaimedDelivery(claimed);
  return NextResponse.json({ ok: true, data: result });
}
