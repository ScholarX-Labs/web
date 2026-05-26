import Link from "next/link";
import type { OpportunityQualityQueueRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type OpportunityCleanupTableProps = {
  rows: readonly OpportunityQualityQueueRow[];
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const issueLabels = {
  expired: "Expired",
  broken_link: "Broken link",
  missing_metadata: "Missing metadata",
  high_save_low_apply: "Saved, low apply",
} as const;

const severityStyles = {
  critical: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-600",
} as const;

export function OpportunityCleanupTable({ rows }: OpportunityCleanupTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="opportunity-cleanup"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="opportunity-cleanup" className="text-sm font-semibold text-slate-950">
          Opportunity cleanup queue
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} signals
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Opportunity</th>
              <th className="py-2 pr-3 font-semibold">Issue</th>
              <th className="py-2 pr-3 font-semibold">Severity</th>
              <th className="py-2 pr-3 font-semibold">Saves</th>
              <th className="py-2 pr-3 font-semibold">Apply rate</th>
              <th className="py-2 pr-3 font-semibold">Last check</th>
              <th className="py-2 pr-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={7}>
                  No opportunity quality signals found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-3 font-medium text-slate-950">
                    <Link className="hover:text-blue-700" href={`/opportunity/${row.opportunityId}`}>
                      {row.title}
                    </Link>
                    {row.missingFields.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Missing: {row.missingFields.join(", ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{issueLabels[row.issueType]}</td>
                  <td className="py-3 pr-3">
                    <span className={`rounded px-2 py-1 text-xs font-semibold uppercase ${severityStyles[row.severity]}`}>
                      {row.severity}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.savedCount.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.applyRate === null ? "-" : percent.format(row.applyRate)}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.lastCheckedAt ? row.lastCheckedAt.slice(0, 10) : "-"}
                  </td>
                  <td className="max-w-xs py-3 pr-3 text-slate-600">{row.recommendedAction}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
