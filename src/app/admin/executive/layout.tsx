import { notFound } from "next/navigation";
import { ExecutiveFilterProvider } from "@/components/executive/filters/executive-filter-provider";
import { EXECUTIVE_ADMIN_ROUTES } from "@/lib/executive/executive-routes";
import { getExecutiveFlags, isExecutiveDashboardEnabled } from "@/lib/executive/feature-flags";

export const dynamic = "force-dynamic";

export default function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isExecutiveDashboardEnabled()) {
    notFound();
  }

  const flags = getExecutiveFlags();
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
