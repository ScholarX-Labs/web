export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { CertificatePortfolioService } from "@/domain/certificates/application/certificate-portfolio.service";

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * GET /api/certificates/portfolio/[username]
 * Public: returns the public portfolio for a given username.
 * Returns 404 if portfolio is disabled or user not found.
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { username } = await params;

  try {
    const service = new CertificatePortfolioService();
    const portfolio = await service.getPublicPortfolio(username);

    if (!portfolio) {
      return NextResponse.json({ error: "Profile not available." }, { status: 404 });
    }

    return NextResponse.json(portfolio);
  } catch (err) {
    console.error(`[GET /api/certificates/portfolio/${username}]`, err);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}
