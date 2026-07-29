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
 * Validates certificate and artifact readiness, then fetches the PDF
 * server-side from the storage backend and streams it to the client with
 * Content-Disposition: attachment so the browser saves it as a file.
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
    const { buffer, filename, contentType } =
      await certDomain.downloadQuery.getDownloadFile(certificateNumber, {
        actorId: undefined, // public download — no actor tracking
      });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, no-transform, max-age=300",
      },
    });
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
      if (error.code === "ARTIFACT_FETCH_FAILED") {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: 502 },
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
