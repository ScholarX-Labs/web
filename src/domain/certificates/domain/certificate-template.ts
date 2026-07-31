/**
 * Certificate template versioning.
 *
 * Template versions are stored on artifact rows so regeneration always uses
 * the correct template, even if a newer template has been deployed.
 */
export const CERTIFICATE_TEMPLATE_VERSIONS = {
  V1: "scholarx-v1",
  V2: "scholarx-v2",
} as const;

export type CertificateTemplateVersion =
  (typeof CERTIFICATE_TEMPLATE_VERSIONS)[keyof typeof CERTIFICATE_TEMPLATE_VERSIONS];

/** The template version used for new certificate issuances */
export const CURRENT_TEMPLATE_VERSION: CertificateTemplateVersion =
  CERTIFICATE_TEMPLATE_VERSIONS.V1;

/** Input data required to render a certificate from any template version */
export interface CertificateRenderData {
  certificateNumber: string;
  recipientName: string;
  programName: string;
  completionDate: Date;
  issuedAt: Date;
  templateVersion: CertificateTemplateVersion;
}

/** Output from a renderer */
export interface CertificateArtifactOutput {
  content: Buffer;
  contentType: string;
  byteSize: number;
  checksumSha256: string;
}
