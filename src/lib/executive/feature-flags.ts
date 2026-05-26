import { env } from "@/config/env";

export type ExecutiveFeatureFlags = {
  EXECUTIVE_DASHBOARD_ENABLED: boolean;
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: boolean;
  EXECUTIVE_FINANCE_ENABLED: boolean;
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: boolean;
  EXECUTIVE_AI_HEATMAP_ENABLED: boolean;
};

const isEnabled = (value: "true" | "false" | undefined): boolean =>
  value === "true";

export function getExecutiveFlags(): ExecutiveFeatureFlags {
  return {
    EXECUTIVE_DASHBOARD_ENABLED: isEnabled(
      env.SCHOLARX_EXECUTIVE_DASHBOARD_ENABLED,
    ),
    EXECUTIVE_TEAM_OPERATIONS_ENABLED: isEnabled(
      env.SCHOLARX_EXECUTIVE_TEAM_OPS_ENABLED,
    ),
    EXECUTIVE_FINANCE_ENABLED: isEnabled(
      env.SCHOLARX_EXECUTIVE_FINANCE_ENABLED,
    ),
    PUBLIC_IMPACT_GOVERNANCE_ENABLED: isEnabled(
      env.SCHOLARX_EXECUTIVE_GOVERNANCE_ENABLED,
    ),
    EXECUTIVE_AI_HEATMAP_ENABLED: isEnabled(
      env.SCHOLARX_EXECUTIVE_AI_HEATMAP_ENABLED,
    ),
  };
}

export function isExecutiveDashboardEnabled(): boolean {
  return getExecutiveFlags().EXECUTIVE_DASHBOARD_ENABLED;
}
