export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificatePortfolioService } from "@/domain/certificates/application/certificate-portfolio.service";

/**
 * GET /api/certificates/wallet
 * Authenticated user: returns all certificates in their wallet.
 */
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const service = new CertificatePortfolioService();
    const certs = await service.getWallet(session.user.id);
    return NextResponse.json(certs);
  } catch (err) {
    console.error("[GET /api/certificates/wallet]", err);
    return NextResponse.json({ error: "Failed to load wallet" }, { status: 500 });
  }
}
