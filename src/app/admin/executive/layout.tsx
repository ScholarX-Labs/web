import { notFound } from "next/navigation";
import { isExecutiveDashboardEnabled } from "@/lib/executive/feature-flags";

export const dynamic = "force-dynamic";

export default function ExecutiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isExecutiveDashboardEnabled()) {
    notFound();
  }

  return <>{children}</>;
}
