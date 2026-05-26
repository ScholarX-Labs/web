import { FreshnessBadge } from "./freshness-badge";
import type { TechnicalFreshnessRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type FreshnessGridProps = {
  rows: readonly TechnicalFreshnessRow[];
};

export function FreshnessGrid({ rows }: FreshnessGridProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="freshness-grid"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="freshness-grid" className="text-sm font-semibold text-slate-950">
          Freshness grid
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} sections
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Section</th>
              <th className="py-2 pr-3 font-semibold">Source</th>
              <th className="py-2 pr-3 font-semibold">Freshness</th>
              <th className="py-2 pr-3 font-semibold">Latest</th>
              <th className="py-2 pr-3 font-semibold">P95</th>
              <th className="py-2 pr-3 font-semibold">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.sectionId}>
                <td className="py-3 pr-3 font-medium text-slate-950">{row.sectionId}</td>
                <td className="py-3 pr-3 text-slate-600">{row.sourceKey}</td>
                <td className="py-3 pr-3">
                  <FreshnessBadge
                    status={row.status}
                    lastSuccessfulAt={row.lastSuccessfulAt}
                  />
                </td>
                <td className="py-3 pr-3 text-slate-600">
                  {row.lastQueryDurationMs === null ? "-" : `${row.lastQueryDurationMs} ms`}
                </td>
                <td className="py-3 pr-3 text-slate-600">
                  {row.rollingP95DurationMs === null ? "-" : `${row.rollingP95DurationMs} ms`}
                </td>
                <td className="py-3 pr-3 text-slate-600">{row.lastErrorCode ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
