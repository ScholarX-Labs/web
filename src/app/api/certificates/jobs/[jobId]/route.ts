export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CertificateAdminService } from "@/domain/certificates/application/certificate-admin.service";
import { headers } from "next/headers";

/**
 * GET /api/certificates/jobs/[jobId]
 * Admin only — poll bulk job progress.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;

  try {
    const service = new CertificateAdminService();
    const job = await service.getBulkJobStatus(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json(job);
  } catch (err) {
    console.error("[GET /api/certificates/jobs/[jobId]]", err);
    return NextResponse.json({ error: "Failed to get job status" }, { status: 500 });
  }
}
