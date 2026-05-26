export class ExecutiveError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ExecutiveError";
  }
}

export const isExecutiveError = (error: unknown): error is ExecutiveError =>
  error instanceof ExecutiveError;

export const ExecutiveErrors = {
  unauthorized: () =>
    new ExecutiveError("EXECUTIVE_UNAUTHORIZED", 403, "Admin role required"),
  disabled: () =>
    new ExecutiveError("EXECUTIVE_DISABLED", 404, "Executive dashboard is disabled"),
  notFound: (entity: string) =>
    new ExecutiveError("RESOURCE_NOT_FOUND", 404, `${entity} not found`),
  validation: (details: Record<string, unknown>) =>
    new ExecutiveError("VALIDATION_ERROR", 422, "Validation failed", details),
  rateLimited: () =>
    new ExecutiveError("RATE_LIMITED", 429, "Too many requests. Please wait before retrying."),
  internal: (message = "Internal server error") =>
    new ExecutiveError("INTERNAL_ERROR", 500, message),
};
