import type { CertificateRenderData, CertificateArtifactOutput } from "../domain/certificate-template";

/**
 * Renderer port — abstracts Playwright/Chromium, a fake renderer, or any
 * future HTML-to-PDF implementation.
 * Application services depend only on this interface.
 */
export interface ICertificateRendererPort {
  renderPdf(data: CertificateRenderData): Promise<CertificateArtifactOutput>;
  renderPngPreview?(data: CertificateRenderData): Promise<CertificateArtifactOutput>;
}
