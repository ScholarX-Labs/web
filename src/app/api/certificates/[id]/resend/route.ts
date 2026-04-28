export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificateAdminService } from "@/domain/certificates/application/certificate-admin.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/certificates/[id]/resend
 * Admin-only: resend the claim email for a PENDING certificate.
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const service = new CertificateAdminService();
    await service.resendClaimEmail({
      certificateId: id,
      adminUserId: session.user.id,
    });
    return NextResponse.json({ id, message: "Claim email resent successfully." });
  } catch (err) {
    console.error(`[POST /api/certificates/${id}/resend]`, err);
    return NextResponse.json({ error: "Failed to resend claim email" }, { status: 500 });
  }
}
