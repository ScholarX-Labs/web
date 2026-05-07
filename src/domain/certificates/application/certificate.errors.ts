// Mirrors next-course.errors.ts exactly — same class shape, numeric code space 8xxx
export class NextCertificateError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly numericCode = 8000,
  ) {
    super(message);
    this.name = "NextCertificateError";
  }
}

export const isNextCertificateError = (v: unknown): v is NextCertificateError =>
  v instanceof NextCertificateError;
