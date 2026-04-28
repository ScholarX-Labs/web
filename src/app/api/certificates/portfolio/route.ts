export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificatePortfolioService } from "@/domain/certificates/application/certificate-portfolio.service";
import { z } from "zod";

const PortfolioUpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9-]+$/, "Only alphanumeric and hyphens allowed")
    .optional(),
  enabled: z.boolean().optional(),
});

/**
 * GET /api/certificates/portfolio
 * Authenticated: returns own portfolio settings.
 */
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const service = new CertificatePortfolioService();
    const settings = await service.getPortfolioSettings(session.user.id);
    return NextResponse.json(settings);
  } catch (err) {
    console.error("[GET /api/certificates/portfolio]", err);
    return NextResponse.json({ error: "Failed to load portfolio settings" }, { status: 500 });
  }
}

/**
 * PUT /api/certificates/portfolio
 * Authenticated: set portfolio username and/or enable/disable portfolio.
 */
export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PortfolioUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  try {
    const service = new CertificatePortfolioService();
    const result = await service.setPortfolioUsername({
      userId: session.user.id,
      username: parsed.data.username ?? "",
      enabled: parsed.data.enabled ?? true,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update portfolio";
    const isDuplicate = msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("taken");
    return NextResponse.json(
      { error: isDuplicate ? "Username already taken." : msg },
      { status: isDuplicate ? 409 : 500 },
    );
  }
}
