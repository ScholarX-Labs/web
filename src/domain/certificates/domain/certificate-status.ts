import { CertificateError } from "./certificate-errors";

/**
 * Certificate lifecycle state machine.
 *
 * Allowed transitions:
 *   pending  → issued
 *   issued   → claimed
 *   issued   → revoked
 *   claimed  → revoked
 *
 * Disallowed (must throw):
 *   revoked  → anything
 *   claimed  → issued
 */
export const CERTIFICATE_STATUS = {
  PENDING: "pending",
  ISSUED: "issued",
  CLAIMED: "claimed",
  REVOKED: "revoked",
} as const;

export type CertificateStatus =
  (typeof CERTIFICATE_STATUS)[keyof typeof CERTIFICATE_STATUS];

const ALLOWED_TRANSITIONS: Record<CertificateStatus, ReadonlySet<CertificateStatus>> = {
  pending: new Set(["issued", "revoked"]),
  issued: new Set(["claimed", "revoked"]),
  claimed: new Set(["revoked"]),
  revoked: new Set(),
};

export function assertValidCertificateTransition(
  from: CertificateStatus,
  to: CertificateStatus,
): void {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed.has(to)) {
    throw new CertificateError(
      "INVALID_STATUS_TRANSITION",
      409,
      `Invalid certificate status transition: ${from} → ${to}`,
      { from, to },
    );
  }
}
