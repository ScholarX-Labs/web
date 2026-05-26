import type { ExecutiveMetricSensitivity } from "../contracts/executive-types";

export type RedactionLevel = "overview" | "export" | "drilldown";

export type RedactionDecision = {
  allowed: boolean;
  note?: string;
};

const SENSITIVE_KEYS = new Set([
  "name",
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "phoneNumber",
  "paymentId",
  "recipientEmail",
  "ipAddress",
  "userAgent",
]);

export class ExecutiveRedactionPolicy {
  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
      Boolean(value) &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      (value as { constructor?: unknown }).constructor === Object
    );
  }

  private redactValue(
    value: unknown,
    hasPiiDrilldownAccess: boolean,
  ): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) =>
        this.redactValue(entry, hasPiiDrilldownAccess),
      );
    }

    if (this.isPlainObject(value)) {
      return this.redactRecord(value, hasPiiDrilldownAccess);
    }

    return value;
  }

  canViewSensitivity(
    sensitivity: ExecutiveMetricSensitivity,
    level: RedactionLevel,
    hasPiiDrilldownAccess: boolean,
  ): RedactionDecision {
    if (sensitivity === "public_safe" || sensitivity === "admin_only") {
      return { allowed: true };
    }

    if (sensitivity === "executive_only") {
      return level === "overview" || level === "export"
        ? { allowed: true }
        : { allowed: hasPiiDrilldownAccess, note: "Executive-only drilldown restricted." };
    }

    return hasPiiDrilldownAccess
      ? { allowed: true }
      : { allowed: false, note: "Restricted content omitted by role policy." };
  }

  redactRecord<TRecord extends Record<string, unknown>>(
    record: TRecord,
    hasPiiDrilldownAccess: boolean,
  ): TRecord {
    if (hasPiiDrilldownAccess) return record;

    const redacted = Object.entries(record).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (SENSITIVE_KEYS.has(key)) {
          acc[key] = null;
          return acc;
        }
        acc[key] = this.redactValue(value, hasPiiDrilldownAccess);
        return acc;
      },
      {},
    );

    return redacted as TRecord;
  }
}

export function createExecutiveRedactionPolicy(): ExecutiveRedactionPolicy {
  return new ExecutiveRedactionPolicy();
}
