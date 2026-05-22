import { NextRequest, NextResponse } from "next/server";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ certificateNumber: string }>;
}

/**
 * GET /api/certificates/:certificateNumber/artifact-status
 *
 * Public endpoint for client-side artifact status polling.
 * Returns only the PDF artifact status — no private certificate metadata.
 *
 * Auth: not required for public certificates.
 * Response: { certificateNumber, pdf: { status, downloadUrl, nextPollAfterMs } }
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { certificateNumber } = await context.params;

    const certDomain = createCertificateDomain();
    const status = await certDomain.verificationQuery.getArtifactStatus(
      certificateNumber,
    );

    if (!status) {
      return NextResponse.json(
        { success: false, error: { code: "CERTIFICATE_NOT_FOUND", statusCode: 404 } },
        { status: 404 },
      );
    }

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("[GET /api/certificates/artifact-status] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", statusCode: 500 } },
      { status: 500 },
    );
  }
}
