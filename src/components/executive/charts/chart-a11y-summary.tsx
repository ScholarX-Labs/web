import { cn } from "@/lib/utils";

export type ChartA11ySummaryProps = {
  title: string;
  summary: string;
  className?: string;
};

export function ChartA11ySummary({
  title,
  summary,
  className,
}: ChartA11ySummaryProps) {
  return (
    <details
      className={cn(
        "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm",
        className,
      )}
    >
      <summary className="cursor-pointer font-medium text-slate-700">
        {title}
      </summary>
      <p className="mt-2 text-slate-600">{summary}</p>
    </details>
  );
}
