import { createHash } from "crypto";
import type { ICertificateRendererPort } from "../../contracts/certificate-renderer.port";
import type {
  CertificateRenderData,
  CertificateArtifactOutput,
} from "../../domain/certificate-template";

/**
 * FakeCertificateRendererAdapter — deterministic stub for tests and local dev.
 * Returns a minimal valid PDF-like byte buffer so artifact pipelines can be
 * exercised without requiring Playwright or browser dependencies.
 */
export class FakeCertificateRendererAdapter
  implements ICertificateRendererPort
{
  async renderPdf(data: CertificateRenderData): Promise<CertificateArtifactOutput> {
    // Minimal PDF header — valid enough to test binary handling
    const pdfContent = `%PDF-1.4\n%ScholarX Certificate\n%%EOF\n`;
    const payload = `${data.certificateNumber}|${data.recipientName}|${data.programName}|${data.completionDate.toISOString()}`;
    const content = Buffer.from(`${pdfContent}% ${payload}\n`);
    const checksum = createHash("sha256").update(content).digest("hex");

    return {
      content,
      contentType: "application/pdf",
      byteSize: content.length,
      checksumSha256: checksum,
    };
  }

  async renderPngPreview(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _data: CertificateRenderData,
  ): Promise<CertificateArtifactOutput> {
    // Minimal 1x1 PNG
    const png = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489000000" +
        "0a49444154789c6260000000000200014221bc330000000049454e44ae426082",
      "hex",
    );
    const checksum = createHash("sha256").update(png).digest("hex");
    return {
      content: png,
      contentType: "image/png",
      byteSize: png.length,
      checksumSha256: checksum,
    };
  }
}
