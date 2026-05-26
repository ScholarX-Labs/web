import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExecutiveSectionState } from "@/domain/executive/contracts/executive-types";

export type MetricCardProps = {
  label: string;
  value: string | number | null;
  format?: "number" | "currency" | "percent" | "duration";
  deltaPercent?: number | null;
  favorableDirection?: "up" | "down" | "neutral";
  state: ExecutiveSectionState;
  className?: string;
};

function formatValue(
  value: string | number | null,
  format: NonNullable<MetricCardProps["format"]>,
): string {
  if (value === null) return "-";
  if (typeof value === "string") return value;
  if (format === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (format === "percent") {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US").format(value);
}

function getDeltaTone(
  deltaPercent: number | null | undefined,
  favorableDirection: NonNullable<MetricCardProps["favorableDirection"]>,
): string {
  if (deltaPercent === null || deltaPercent === undefined || favorableDirection === "neutral") {
    return "text-slate-500";
  }
  const isGood =
    favorableDirection === "up" ? deltaPercent >= 0 : deltaPercent <= 0;
  return isGood ? "text-emerald-700" : "text-rose-700";
}

export function MetricCard({
  label,
  value,
  format = "number",
  deltaPercent,
  favorableDirection = "neutral",
  state,
  className,
}: MetricCardProps) {
  const DeltaIcon =
    deltaPercent === null || deltaPercent === undefined
      ? ArrowRight
      : deltaPercent >= 0
        ? ArrowUpRight
        : ArrowDownRight;

  return (
    <section
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-4 shadow-sm",
        "min-h-32 min-w-0",
        className,
      )}
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className="text-xs font-medium uppercase text-slate-400">
          {state.status}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="truncate text-3xl font-semibold tracking-normal text-slate-950">
          {formatValue(value, format)}
        </p>
        <div
          className={cn(
            "flex shrink-0 items-center gap-1 text-sm font-medium",
            getDeltaTone(deltaPercent, favorableDirection),
          )}
        >
          <DeltaIcon className="size-4" aria-hidden="true" />
          <span>
            {deltaPercent === null || deltaPercent === undefined
              ? "n/a"
              : new Intl.NumberFormat("en-US", {
                  style: "percent",
                  maximumFractionDigits: 1,
                }).format(deltaPercent)}
          </span>
        </div>
      </div>
      {state.message ? (
        <p className="mt-3 line-clamp-2 text-xs text-slate-500">{state.message}</p>
      ) : null}
    </section>
  );
}
