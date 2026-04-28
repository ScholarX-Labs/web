export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { CertificateVerificationService } from "@/domain/certificates/application/certificate-verification.service";
import { createHash } from "crypto";

/**
 * GET /api/certificates/verify/[id]
 * Public — no auth required.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "";
  const userAgentHash = createHash("sha256").update(userAgent).digest("hex");

  // Very rough country-code extraction from CF-IPCountry header (Cloudflare)
  const ipRegion = req.headers.get("cf-ipcountry") ?? ip.slice(0, 10);

  try {
    const service = new CertificateVerificationService();
    const result = await service.verify({ certificateId: id, ipRegion, userAgentHash });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/certificates/verify]", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 },
    );
  }
}
