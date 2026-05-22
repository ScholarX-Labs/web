import type { EmailFailureCategory } from "../contracts/email-types";
import { safeFailureReason } from "./email-sanitization";

type ClassifiedEmailError = {
  failureCategory: EmailFailureCategory;
  safeReason: string;
  retryable: boolean;
  fallbackEligible: boolean;
};

export function classifyEmailError(error: unknown): ClassifiedEmailError {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown provider error";

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  const normalized = `${code} ${message}`.toLowerCase();

  if (normalized.includes("auth") || normalized.includes("login")) {
    return result("authentication", message, false, false);
  }

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return result("rate_limited", message, true, true);
  }

  if (
    normalized.includes("recipient") ||
    normalized.includes("mailbox") ||
    normalized.includes("no such user")
  ) {
    return result("recipient_rejected", message, false, false);
  }

  if (normalized.includes("content") || normalized.includes("spam")) {
    return result("content_rejected", message, false, false);
  }

  if (
    normalized.includes("timeout") ||
    code === "etimedout" ||
    normalized.includes("timed out")
  ) {
    return result("timeout", message, true, true);
  }

  if (
    normalized.includes("econn") ||
    normalized.includes("network") ||
    normalized.includes("unavailable") ||
    normalized.includes("temporary")
  ) {
    return result("provider_unavailable", message, true, true);
  }

  return result("unknown", message, true, true);
}

function result(
  failureCategory: EmailFailureCategory,
  reason: string,
  retryable: boolean,
  fallbackEligible: boolean,
): ClassifiedEmailError {
  return {
    failureCategory,
    safeReason: safeFailureReason(reason),
    retryable,
    fallbackEligible,
  };
}
