export interface NextCourseErrorDetails {
  [key: string]: unknown;
}

export class NextCourseError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly numericCode = 9000,
    readonly details?: NextCourseErrorDetails,
  ) {
    super(message);
    this.name = "NextCourseError";
  }
}

export const isNextCourseError = (value: unknown): value is NextCourseError =>
  value instanceof NextCourseError;
