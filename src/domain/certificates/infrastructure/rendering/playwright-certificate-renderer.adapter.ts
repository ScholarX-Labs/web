/**
 * PlaywrightCertificateRendererAdapter
 *
 * Renders certificates to PDF (and optionally PNG) using Playwright/Chromium.
 * This adapter is ONLY loaded by the worker entrypoint.
 * It must NEVER be imported from Next.js pages, route handlers, or
 * Client Components — doing so would bundle Chromium into the web app.
 *
 * Template source: public/certificate-template.svg (scholarx-v1)
 */
import { readFileSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
import type { ICertificateRendererPort } from "../../contracts/certificate-renderer.port";
import type {
  CertificateRenderData,
  CertificateArtifactOutput,
} from "../../domain/certificate-template";

const TEMPLATE_PATH = join(process.cwd(), "public", "certificate-template.svg");

function buildHtml(data: CertificateRenderData, svgTemplate: string): string {
  const dateStr = data.completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Replace SVG placeholders — convention: {{FIELD_NAME}}
  const filled = svgTemplate
    .replace(/\{\{RECIPIENT_NAME\}\}/g, escapeXml(data.recipientName))
    .replace(/\{\{PROGRAM_NAME\}\}/g, escapeXml(data.programName))
    .replace(/\{\{COMPLETION_DATE\}\}/g, escapeXml(dateStr))
    .replace(/\{\{CERTIFICATE_NUMBER\}\}/g, escapeXml(data.certificateNumber));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScholarX Certificate</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 297mm; height: 210mm; background: white; }
    .svg-container { width: 100%; height: 100%; }
    svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="svg-container">
    ${filled}
  </div>
</body>
</html>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export class PlaywrightCertificateRendererAdapter
  implements ICertificateRendererPort
{
  private svgTemplate: string | null = null;

  private getTemplate(): string {
    if (!this.svgTemplate) {
      this.svgTemplate = readFileSync(TEMPLATE_PATH, "utf-8");
    }
    return this.svgTemplate;
  }

  async renderPdf(data: CertificateRenderData): Promise<CertificateArtifactOutput> {
    // Lazy import — Playwright is only available in the worker container
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- playwright is installed in the worker container, not the web bundle
    const { chromium } = await import("playwright");

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const html = buildHtml(data, this.getTemplate());

      await page.setContent(html, { waitUntil: "networkidle" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      const content = Buffer.from(pdfBuffer);
      const checksum = createHash("sha256").update(content).digest("hex");

      return {
        content,
        contentType: "application/pdf",
        byteSize: content.length,
        checksumSha256: checksum,
      };
    } finally {
      await browser.close();
    }
  }

  async renderPngPreview(
    data: CertificateRenderData,
  ): Promise<CertificateArtifactOutput> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore -- playwright is installed in the worker container, not the web bundle
    const { chromium } = await import("playwright");

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1123, height: 794 }); // A4 landscape at 96 DPI
      const html = buildHtml(data, this.getTemplate());
      await page.setContent(html, { waitUntil: "networkidle" });

      const pngBuffer = await page.screenshot({
        type: "png",
        fullPage: false,
      });

      const content = Buffer.from(pngBuffer);
      const checksum = createHash("sha256").update(content).digest("hex");

      return {
        content,
        contentType: "image/png",
        byteSize: content.length,
        checksumSha256: checksum,
      };
    } finally {
      await browser.close();
    }
  }
}
