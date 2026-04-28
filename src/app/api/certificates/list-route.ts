export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificateAdminService } from "@/domain/certificates/application/certificate-admin.service";
import type { CertificateListQuery } from "@/domain/certificates/contracts";

/**
 * GET /api/certificates?courseId=&seasonNumber=&status=&role=&page=&limit=
 * Admin-only: paginated list with filters.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const query: CertificateListQuery = {
    courseId: sp.get("courseId") ?? undefined,
    seasonNumber: sp.get("seasonNumber") ? Number(sp.get("seasonNumber")) : undefined,
    status: (sp.get("status") as CertificateListQuery["status"]) ?? undefined,
    role: (sp.get("role") as CertificateListQuery["role"]) ?? undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    limit: sp.get("limit") ? Math.min(Number(sp.get("limit")), 100) : 20,
  };

  try {
    const service = new CertificateAdminService();
    const result = await service.list(query);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/certificates]", err);
    return NextResponse.json({ error: "Failed to list certificates" }, { status: 500 });
  }
}

/**
 * POST /api/certificates
 * Admin-only: manually issue a single certificate.
 * (already implemented — keep existing handler above, this GET extends it)
 */
export { POST } from "./post-handler";
