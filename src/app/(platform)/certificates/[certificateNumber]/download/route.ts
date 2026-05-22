import { type NextRequest, NextResponse } from "next/server";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import { isCertificateError } from "@/domain/certificates/domain/certificate-errors";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ certificateNumber: string }>;
}

/**
 * GET /certificates/:certificateNumber/download
 *
 * Public PDF download route.
 * Validates certificate and artifact readiness, then redirects to a
 * short-lived SAS URL or streams through if needed.
 *
 * Auth: not required for public certificates.
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse | Response> {
  try {
    const { certificateNumber } = await context.params;

    const certDomain = createCertificateDomain();
    const downloadUrl = await certDomain.downloadQuery.getDownloadUrl(
      certificateNumber,
      { actorId: undefined }, // public download — no actor tracking
    );

    // Redirect to the signed URL or public CDN URL
    return NextResponse.redirect(downloadUrl, { status: 302 });
  } catch (error) {
    if (isCertificateError(error)) {
      if (error.code === "CERTIFICATE_NOT_FOUND") {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: 404 },
        );
      }
      if (error.code === "ARTIFACT_NOT_READY") {
        return NextResponse.json(
          { error: error.code, message: error.message, details: error.details },
          { status: 409 },
        );
      }
      if (error.code === "CERTIFICATE_REVOKED") {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[GET /certificates/download] Unhandled error:", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
      { status: 500 },
    );
  }
}
