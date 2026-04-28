export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { db } from "@/db";

/**
 * POST /api/certificates/gdpr
 * Admin-only: anonymize all certificate data for a given userId.
 *
 * GDPR Article 17 (Right to Erasure) compliance.
 * Replaces PII fields with anonymized values:
 * - recipientName → "[Redacted]"
 * - recipientEmail → "deleted@scholarx.lk"
 * The certificate record is retained for audit/integrity purposes (shortId, signatureFingerprint remain).
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

  const { userId } = body as { userId?: string };
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 422 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repo = new CertificatesRepository(db as any);
    const count = await repo.anonymizeByUserId(userId);

    return NextResponse.json({
      message: `GDPR erasure completed. ${count} certificate(s) anonymized.`,
      userId,
      anonymizedCount: count,
    });
  } catch (err) {
    console.error("[POST /api/certificates/gdpr]", err);
    return NextResponse.json({ error: "GDPR erasure failed" }, { status: 500 });
  }
}
