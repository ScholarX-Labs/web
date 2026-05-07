import { ApiRequestError } from "@/lib/api/courses.service";
import { EnrollmentErrorCode } from "@/lib/enrollment/types";

const DEFAULT_MESSAGE = "Something went wrong during enrollment.";

const toFallbackCode = (status: number): EnrollmentErrorCode => {
  if (status === 401 || status === 403) return "auth_required";
  if (status === 404) return "course_not_found";
  if (status === 400 || status === 422) return "validation_failure";
  if (status >= 500) return "network_transient";
  return "unknown";
};

export interface EnrollmentMappedError {
  code: EnrollmentErrorCode;
  message: string;
}

export const mapEnrollmentError = (error: unknown): EnrollmentMappedError => {
  // Use both instanceof and structural checking for robust error identification across HMR boundaries
  const isApiError =
    error instanceof ApiRequestError ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name: unknown }).name === "ApiRequestError");

  if (isApiError) {
    const apiError = error as ApiRequestError;
    return {
      code: apiError.code ?? toFallbackCode(apiError.status),
      message: apiError.message || DEFAULT_MESSAGE,
    };
  }

  if (error instanceof Error) {
    return {
      code: "unknown",
      message: error.message || DEFAULT_MESSAGE,
    };
  }

  return {
    code: "unknown",
    message: DEFAULT_MESSAGE,
  };
};
