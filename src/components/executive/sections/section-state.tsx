import { AlertTriangle, Loader2, Lock, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutiveSectionState } from "@/domain/executive/contracts/executive-types";
import { FreshnessBadge } from "./freshness-badge";

export type SectionStateProps = {
  state: ExecutiveSectionState;
  title: string;
  children?: React.ReactNode;
  className?: string;
};

const stateIcon = {
  ready: null,
  empty: MinusCircle,
  data_gap: AlertTriangle,
  stale: AlertTriangle,
  partial: AlertTriangle,
  error: AlertTriangle,
  access_denied: Lock,
} satisfies Record<ExecutiveSectionState["status"], typeof AlertTriangle | null>;

export function SectionState({
  state,
  title,
  children,
  className,
}: SectionStateProps) {
  if (state.status === "ready" && children) {
    return <>{children}</>;
  }

  const Icon = state.status === "ready" ? Loader2 : stateIcon[state.status];

  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
      aria-label={title}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
        <FreshnessBadge
          status={state.freshness}
          lastSuccessfulAt={state.lastSuccessfulAt}
        />
      </div>
      <div className="mt-6 flex min-h-28 flex-col items-center justify-center gap-2 text-center">
        {Icon ? <Icon className="size-5 text-slate-500" aria-hidden="true" /> : null}
        <p className="text-sm font-medium text-slate-700">
          {state.message ?? state.status.replace("_", " ")}
        </p>
        {state.source ? (
          <p className="max-w-md text-xs text-slate-500">Source: {state.source}</p>
        ) : null}
      </div>
    </section>
  );
}
