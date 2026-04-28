export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificateAdminService } from "@/domain/certificates/application/certificate-admin.service";

/**
 * GET /api/certificates/export?courseId=&seasonNumber=&format=csv
 * Admin-only: export certificates as CSV.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const courseId = sp.get("courseId") ?? undefined;
  const seasonNumber = sp.get("seasonNumber") ? Number(sp.get("seasonNumber")) : undefined;

  try {
    const service = new CertificateAdminService();
    // Fetch all matching records (no pagination for export)
    const { items } = await service.list({ courseId, seasonNumber, limit: 10000, page: 1 });

    // Build CSV
    const header = [
      "shortId",
      "recipientName",
      "recipientEmail",
      "programName",
      "seasonNumber",
      "role",
      "status",
      "issuedAt",
      "claimedAt",
    ].join(",");

    const rows = items.map((c) =>
      [
        c.shortId,
        `"${c.recipientName.replace(/"/g, '""')}"`,
        c.recipientEmail,
        `"${c.programName.replace(/"/g, '""')}"`,
        c.seasonNumber,
        c.role,
        c.status,
        new Date(c.issuedAt).toISOString(),
        c.claimedAt ? new Date(c.claimedAt).toISOString() : "",
      ].join(","),
    );

    const csv = [header, ...rows].join("\n");
    const filename = `scholarx-certificates-${courseId ?? "all"}-${Date.now()}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[GET /api/certificates/export]", err);
    return NextResponse.json({ error: "Failed to export certificates" }, { status: 500 });
  }
}
