/**
 * CertificateError
 *
 * Domain error class for the Certification Module.
 * Mirrors the NextCourseError pattern from src/domain/courses/application/next-course.errors.ts
 */
export class CertificateError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly errorCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: string,
    httpStatus: number,
    message: string,
    errorCode: number,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CertificateError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.errorCode = errorCode;
    this.context = context;
  }
}
