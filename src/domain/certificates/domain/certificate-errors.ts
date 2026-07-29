/**
 * Certificate domain error class.
 * Provides typed error codes, HTTP status codes, and optional detail payload.
 */
export type CertificateErrorCode =
  | "CERTIFICATE_NOT_FOUND"
  | "CERTIFICATE_NOT_ELIGIBLE"
  | "CERTIFICATE_ALREADY_REVOKED"
  | "CERTIFICATE_REVOKED"
  | "CERTIFICATE_ISSUE_FAILED"
  | "ARTIFACT_NOT_READY"
  | "ARTIFACT_NOT_FOUND"
  | "ARTIFACT_FETCH_FAILED"
  | "INVALID_STATUS_TRANSITION"
  | "STORAGE_UPLOAD_FAILED"
  | "QUEUE_PUBLISH_FAILED"
  | "RENDER_FAILED"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

export class CertificateError extends Error {
  constructor(
    public readonly code: CertificateErrorCode,
    public readonly statusCode: number,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CertificateError";
  }
}

export function isCertificateError(error: unknown): error is CertificateError {
  return error instanceof CertificateError;
}
