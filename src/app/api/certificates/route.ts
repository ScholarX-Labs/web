export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CertificateIssuanceService } from "@/domain/certificates/application/certificate-issuance.service";
import { headers } from "next/headers";
import type { IssueCertificateInput } from "@/domain/certificates/contracts";

/**
 * POST /api/certificates
 * Admin-only: manually issue a single certificate.
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

  const input = body as Partial<IssueCertificateInput>;

  if (
    !input.userId ||
    !input.recipientName ||
    !input.recipientEmail ||
    !input.courseId ||
    !input.programName ||
    input.seasonNumber === undefined ||
    !input.role ||
    !input.completionDate
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 422 },
    );
  }

  if (input.role !== "mentee" && input.role !== "mentor") {
    return NextResponse.json(
      { error: "role must be 'mentee' or 'mentor'" },
      { status: 422 },
    );
  }

  try {
    const service = new CertificateIssuanceService();
    const result = await service.issue({
      userId: input.userId,
      recipientName: input.recipientName,
      recipientEmail: input.recipientEmail,
      courseId: input.courseId,
      programName: input.programName,
      seasonNumber: input.seasonNumber,
      role: input.role,
      completionDate: new Date(input.completionDate),
    });

    return NextResponse.json(result, {
      status: result.code === "created" ? 201 : 200,
    });
  } catch (err) {
    console.error("[POST /api/certificates]", err);
    return NextResponse.json(
      { error: "Certificate issuance failed" },
      { status: 500 },
    );
  }
}
