import { AlertCircle, CheckCircle2, Clock3, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutiveFreshnessStatus } from "@/domain/executive/contracts/executive-types";

export type FreshnessBadgeProps = {
  status: ExecutiveFreshnessStatus;
  lastSuccessfulAt: string | null;
  className?: string;
};

const freshnessStyles: Record<ExecutiveFreshnessStatus, string> = {
  current: "border-emerald-200 bg-emerald-50 text-emerald-800",
  stale: "border-amber-200 bg-amber-50 text-amber-800",
  very_stale: "border-orange-200 bg-orange-50 text-orange-900",
  unavailable: "border-slate-200 bg-slate-100 text-slate-700",
};

const freshnessIcons = {
  current: CheckCircle2,
  stale: Clock3,
  very_stale: AlertCircle,
  unavailable: WifiOff,
} satisfies Record<ExecutiveFreshnessStatus, typeof CheckCircle2>;

export function FreshnessBadge({
  status,
  lastSuccessfulAt,
  className,
}: FreshnessBadgeProps) {
  const Icon = freshnessIcons[status];
  const label = status.replace("_", " ");

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium capitalize",
        freshnessStyles[status],
        className,
      )}
      title={lastSuccessfulAt ? `Last successful update: ${lastSuccessfulAt}` : "No successful update"}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}
