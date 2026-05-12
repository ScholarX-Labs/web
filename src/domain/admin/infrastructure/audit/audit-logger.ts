import { db } from "@/db";
import { adminAuditLog } from "@/db/schema/admin-db.schema";

export interface AuditLogEntry {
  adminId: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "secret",
]);

const stripSensitive = (data: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
  if (!data) return undefined;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = stripSensitive(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
};

export const createAuditLogger = () => ({
  log: async (entry: AuditLogEntry): Promise<void> => {
    await db.insert(adminAuditLog).values({
      adminId: entry.adminId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: stripSensitive(entry.before) as Record<string, unknown> | null,
      after: stripSensitive(entry.after) as Record<string, unknown> | null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  },
});

export type AuditLogger = ReturnType<typeof createAuditLogger>;
