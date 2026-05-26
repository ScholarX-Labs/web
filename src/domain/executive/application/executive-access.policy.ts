import type { ExecutivePageId } from "../contracts/executive-types";

export type ExecutiveRole =
  | "admin"
  | "executive"
  | "operations"
  | "growth"
  | "finance";

export type ExecutiveResource =
  | ExecutivePageId
  | "export"
  | "pii_drilldown"
  | "public_impact_approval";

export type ExecutiveAction = "read" | "write";

export type ExecutiveAccessInput = {
  role: string | null | undefined;
  resource: ExecutiveResource;
  action: ExecutiveAction;
  phaseTwoRolesEnabled?: boolean;
};

const phaseTwoReadPermissions: Record<ExecutiveRole, readonly ExecutiveResource[]> = {
  admin: [
    "overview",
    "users",
    "courses_lessons",
    "learner_progress",
    "opportunities_ai",
    "technical_health",
    "action_center",
    "public_growth",
    "team_operations",
    "finance",
    "export",
    "pii_drilldown",
    "public_impact_approval",
  ],
  executive: [
    "overview",
    "users",
    "courses_lessons",
    "learner_progress",
    "opportunities_ai",
    "technical_health",
    "action_center",
    "public_growth",
    "team_operations",
    "finance",
    "export",
    "public_impact_approval",
  ],
  operations: [
    "overview",
    "users",
    "courses_lessons",
    "learner_progress",
    "opportunities_ai",
    "technical_health",
    "action_center",
    "public_growth",
    "team_operations",
    "export",
  ],
  growth: [
    "overview",
    "users",
    "courses_lessons",
    "opportunities_ai",
    "public_growth",
    "export",
  ],
  finance: ["overview", "finance", "export"],
};

const phaseTwoWritePermissions: Record<ExecutiveRole, readonly ExecutiveResource[]> = {
  admin: ["action_center", "public_impact_approval"],
  executive: ["public_impact_approval"],
  operations: ["action_center"],
  growth: [],
  finance: [],
};

const isExecutiveRole = (role: string): role is ExecutiveRole =>
  role === "admin" ||
  role === "executive" ||
  role === "operations" ||
  role === "growth" ||
  role === "finance";

export function canAccessExecutiveResource(input: ExecutiveAccessInput): boolean {
  if (!input.role || !isExecutiveRole(input.role)) return false;

  if (!input.phaseTwoRolesEnabled && input.role !== "admin") {
    return false;
  }

  if (input.action === "read") {
    return phaseTwoReadPermissions[input.role].includes(input.resource);
  }

  return phaseTwoWritePermissions[input.role].includes(input.resource);
}

export function assertExecutiveAccess(input: ExecutiveAccessInput): void {
  if (!canAccessExecutiveResource(input)) {
    throw new Error("Executive resource access denied");
  }
}
