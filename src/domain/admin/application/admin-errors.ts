export class AdminError extends Error {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AdminError";
  }
}

export const isAdminError = (error: unknown): error is AdminError =>
  error instanceof AdminError;

export const AdminErrors = {
  unauthorized: () =>
    new AdminError("ADMIN_UNAUTHORIZED", 403, "Admin role required"),
  notFound: (entity: string) =>
    new AdminError("RESOURCE_NOT_FOUND", 404, `${entity} not found`),
  validation: (details: Record<string, unknown>) =>
    new AdminError("VALIDATION_ERROR", 422, "Validation failed", details),
  conflict: (message: string) =>
    new AdminError("CONCURRENCY_CONFLICT", 409, message),
  internal: (message = "Internal server error") =>
    new AdminError("INTERNAL_ERROR", 500, message),
};
