export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificateStorageService } from "@/domain/certificates/application/certificate-storage.service";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { db } from "@/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/certificates/[id]/download?format=pdf|png
 *
 * Authenticated users only (recipient or admin).
 * Returns a 302 redirect to a presigned S3 URL (15-min TTL).
 * Logs a "downloaded" event to the audit log.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format");

  if (format !== "pdf" && format !== "png") {
    return NextResponse.json({ error: "format must be 'pdf' or 'png'" }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repo = new CertificatesRepository(db as any);
  const cert = await repo.findById(id);

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  // Only the recipient or an admin can download
  if (cert.userId !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const storageKey = format === "pdf" ? cert.pdfStorageKey : cert.pngStorageKey;
  if (!storageKey) {
    return NextResponse.json({ error: "Asset not yet generated" }, { status: 404 });
  }

  try {
    const storage = new CertificateStorageService();
    const presignedUrl = await storage.getPresignedUrl(storageKey, 900); // 15 min

    // Log download event (non-blocking)
    repo.logEvent({
      certificateId: id,
      eventType: "downloaded",
      actorId: session.user.id,
    }).catch(console.error);

    return NextResponse.redirect(presignedUrl, { status: 302 });
  } catch (err) {
    console.error(`[GET /api/certificates/${id}/download]`, err);
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
