import { CertificateError } from "./certificate-errors";

/**
 * Artifact lifecycle state machine.
 *
 * Allowed transitions:
 *   pending    → generating
 *   generating → ready
 *   generating → failed
 *   failed     → generating   (retry)
 *   ready      → generating   (explicit admin regeneration only)
 */
export const ARTIFACT_STATUS = {
  PENDING: "pending",
  GENERATING: "generating",
  READY: "ready",
  FAILED: "failed",
} as const;

export type ArtifactStatus =
  (typeof ARTIFACT_STATUS)[keyof typeof ARTIFACT_STATUS];

const ALLOWED_TRANSITIONS: Record<ArtifactStatus, ReadonlySet<ArtifactStatus>> =
  {
    pending: new Set(["generating"]),
    generating: new Set(["ready", "failed"]),
    failed: new Set(["generating"]),
    ready: new Set(["generating"]), // regeneration only
  };

export function assertValidArtifactTransition(
  from: ArtifactStatus,
  to: ArtifactStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.has(to)) {
    throw new CertificateError(
      "INVALID_STATUS_TRANSITION",
      409,
      `Invalid artifact status transition: ${from} → ${to}`,
      { from, to },
    );
  }
}

export function isRetryableArtifactStatus(status: ArtifactStatus): boolean {
  return status === "pending" || status === "failed";
}
