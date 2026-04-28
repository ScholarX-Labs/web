export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificateAdminService } from "@/domain/certificates/application/certificate-admin.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/certificates/[id]/revoke
 * Admin-only: revoke a certificate with a reason.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { reason } = body as { reason?: string };
  if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
    return NextResponse.json({ error: "reason is required" }, { status: 422 });
  }

  try {
    const service = new CertificateAdminService();
    await service.revoke({
      certificateId: id,
      adminUserId: session.user.id,
      reason: reason.trim(),
    });
    return NextResponse.json({ id, status: "REVOKED" });
  } catch (err) {
    console.error(`[POST /api/certificates/${id}/revoke]`, err);
    return NextResponse.json({ error: "Failed to revoke certificate" }, { status: 500 });
  }
}
