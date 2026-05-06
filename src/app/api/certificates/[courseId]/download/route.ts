import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createNextCertificateDomain } from "@/domain/certificates/factory/next-certificate-domain.factory";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  // 1. Auth gate — protect from unauthenticated access
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Generate PDF (service validates ownership via userId+courseId pair)
  const { courseId } = await params;
  const pdfBuffer = await createNextCertificateDomain()
    .certificates.generatePdf(session.user.id, courseId);

  if (!pdfBuffer) {
    return new Response("Certificate not found", { status: 404 });
  }

  // 3. Return binary response — browser will trigger download
  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="scholarx-certificate-${courseId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
