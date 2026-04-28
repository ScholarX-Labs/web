export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CertificateAdminService } from "@/domain/certificates/application/certificate-admin.service";
import { headers } from "next/headers";

/**
 * POST /api/certificates/bulk
 * Admin only — trigger bulk season issuance. Returns job ID immediately.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { courseId, seasonNumber } = body as {
    courseId?: string;
    seasonNumber?: number;
  };

  if (!courseId || seasonNumber === undefined) {
    return NextResponse.json(
      { error: "courseId and seasonNumber are required" },
      { status: 422 },
    );
  }

  try {
    const service = new CertificateAdminService();
    const job = await service.bulkIssue({
      courseId,
      seasonNumber,
      triggeredByUserId: session.user.id,
    });
    return NextResponse.json(job, { status: 202 });
  } catch (err) {
    console.error("[POST /api/certificates/bulk]", err);
    return NextResponse.json({ error: "Failed to start bulk job" }, { status: 500 });
  }
}
