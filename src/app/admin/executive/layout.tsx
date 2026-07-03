import { notFound } from "next/navigation";
import { ExecutiveFilterProvider } from "@/components/executive/filters/executive-filter-provider";
import { EXECUTIVE_ADMIN_ROUTES } from "@/lib/executive/executive-routes";
import { getExecutiveFlags } from "@/lib/executive/feature-flags";

export const dynamic = "force-dynamic";

export default function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isProduction = process.env.NODE_ENV === "production";
  const flags = getExecutiveFlags();

  if (isProduction) {
    console.info("[admin/executive/layout] feature-flags", {
      pathname: "/admin/executive",
      dashboardEnabled: flags.EXECUTIVE_DASHBOARD_ENABLED,
      teamOperationsEnabled: flags.EXECUTIVE_TEAM_OPERATIONS_ENABLED,
      financeEnabled: flags.EXECUTIVE_FINANCE_ENABLED,
      governanceEnabled: flags.PUBLIC_IMPACT_GOVERNANCE_ENABLED,
      aiHeatmapEnabled: flags.EXECUTIVE_AI_HEATMAP_ENABLED,
      rawEnv: {
        SCHOLARX_EXECUTIVE_DASHBOARD_ENABLED:
          process.env.SCHOLARX_EXECUTIVE_DASHBOARD_ENABLED ?? null,
        SCHOLARX_EXECUTIVE_TEAM_OPS_ENABLED:
          process.env.SCHOLARX_EXECUTIVE_TEAM_OPS_ENABLED ?? null,
        SCHOLARX_EXECUTIVE_FINANCE_ENABLED:
          process.env.SCHOLARX_EXECUTIVE_FINANCE_ENABLED ?? null,
        SCHOLARX_EXECUTIVE_GOVERNANCE_ENABLED:
          process.env.SCHOLARX_EXECUTIVE_GOVERNANCE_ENABLED ?? null,
        SCHOLARX_EXECUTIVE_AI_HEATMAP_ENABLED:
          process.env.SCHOLARX_EXECUTIVE_AI_HEATMAP_ENABLED ?? null,
      },
    });
  }

  if (!flags.EXECUTIVE_DASHBOARD_ENABLED) {
    if (isProduction) {
      console.warn("[admin/executive/layout] not-found", {
        reason: "executive-dashboard-flag-disabled",
      });
    }
    notFound();
  }

  const navigationItems = [
    { label: "Overview", href: EXECUTIVE_ADMIN_ROUTES.OVERVIEW },
    { label: "Users", href: EXECUTIVE_ADMIN_ROUTES.USERS },
    { label: "Courses", href: EXECUTIVE_ADMIN_ROUTES.COURSES_LESSONS },
    { label: "Opportunities", href: EXECUTIVE_ADMIN_ROUTES.OPPORTUNITIES_AI },
    { label: "Technical", href: EXECUTIVE_ADMIN_ROUTES.TECHNICAL_HEALTH },
    { label: "Actions", href: EXECUTIVE_ADMIN_ROUTES.ACTION_CENTER },
    { label: "Growth", href: EXECUTIVE_ADMIN_ROUTES.PUBLIC_GROWTH },
    ...(flags.EXECUTIVE_FINANCE_ENABLED
      ? [{ label: "Finance", href: EXECUTIVE_ADMIN_ROUTES.FINANCE }]
      : []),
  ] as const;

  return (
    <ExecutiveFilterProvider navigationItems={navigationItems}>
      {children}
    </ExecutiveFilterProvider>
  );
}
