import { createHash } from "crypto";
import type { ICertificateRendererPort } from "../../contracts/certificate-renderer.port";
import type {
  CertificateRenderData,
  CertificateArtifactOutput,
} from "../../domain/certificate-template";

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildMinimalPdf(data: CertificateRenderData): Buffer {
  const lines = [
    "BT",
    "/F1 24 Tf",
    "72 500 Td",
    "(ScholarX Certificate) Tj",
    "0 -40 Td",
    "/F1 14 Tf",
    `(Certificate: ${escapePdfText(data.certificateNumber)}) Tj`,
    "0 -24 Td",
    `(Recipient: ${escapePdfText(data.recipientName)}) Tj`,
    "0 -24 Td",
    `(Program: ${escapePdfText(data.programName)}) Tj`,
    "ET",
  ];
  const stream = `${lines.join("\n")}\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf);
}

/**
 * FakeCertificateRendererAdapter — deterministic stub for tests and local dev.
 * Returns a minimal valid PDF so artifact pipelines can be exercised without
 * requiring Playwright or browser dependencies.
 */
export class FakeCertificateRendererAdapter
  implements ICertificateRendererPort
{
  async renderPdf(data: CertificateRenderData): Promise<CertificateArtifactOutput> {
    const content = buildMinimalPdf(data);
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
