import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DrizzleEmailDeliveryRepository } from "@/domain/email/infrastructure/db/drizzle-email-delivery.repository";
import { maskEmailAddress } from "@/domain/email/application/email-sanitization";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorized = await requireAdmin();
  if (!authorized) return adminError();

  const page = positiveInt(request.nextUrl.searchParams.get("page"), 1);
  const limit = Math.min(positiveInt(request.nextUrl.searchParams.get("limit"), 25), 100);
  const repository = new DrizzleEmailDeliveryRepository();
  const result = await repository.list({
    page,
    limit,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    category: request.nextUrl.searchParams.get("category") ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    data: {
      items: result.items.map((item) => ({
        id: item.id,
        requestId: item.requestId,
        category: item.category,
        status: item.status,
        recipientMasked: maskEmailAddress(item.recipientEmail),
        acceptedProvider: item.acceptedProvider,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      page,
      limit,
      total: result.total,
    },
  });
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.role === "admin";
}

function adminError() {
  return NextResponse.json(
    { ok: false, error: { code: "UNAUTHORIZED", message: "Admin access is required" } },
    { status: 401 },
  );
}

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
