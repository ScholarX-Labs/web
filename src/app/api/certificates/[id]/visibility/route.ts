export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { CertificatesRepository } from "@/domain/certificates/infrastructure/db/certificates.repository";
import { db } from "@/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/certificates/[id]/visibility
 * Authenticated: toggle a certificate's public visibility.
 * Only the owning recipient can change visibility.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { isPublic } = body as { isPublic?: boolean };
  if (typeof isPublic !== "boolean") {
    return NextResponse.json({ error: "isPublic (boolean) is required" }, { status: 422 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repo = new CertificatesRepository(db as any);
  const cert = await repo.findById(id);

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  if (cert.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await repo.setVisibility(id, isPublic);
    return NextResponse.json({ id, isPublic });
  } catch (err) {
    console.error(`[PATCH /api/certificates/${id}/visibility]`, err);
    return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
  }
}
