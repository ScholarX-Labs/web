export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { CertificateClaimService } from "@/domain/certificates/application/certificate-claim.service";

/**
 * POST /api/certificates/claim
 * Public — no auth required. Accepts claim token.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { claimToken, userId } = body as {
    claimToken?: string;
    userId?: string;
  };

  if (!claimToken || typeof claimToken !== "string") {
    return NextResponse.json(
      { error: "claimToken is required" },
      { status: 422 },
    );
  }

  try {
    const service = new CertificateClaimService();
    const result = await service.claim({ claimToken, userId });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error("[POST /api/certificates/claim]", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
