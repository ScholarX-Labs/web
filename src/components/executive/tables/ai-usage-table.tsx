import type { AiUsageRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type AiUsageTableProps = {
  rows: readonly AiUsageRow[];
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export function AiUsageTable({ rows }: AiUsageTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="ai-usage"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="ai-usage" className="text-sm font-semibold text-slate-950">
          AI usage by user
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} users
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">User</th>
              <th className="py-2 pr-3 font-semibold">Searches</th>
              <th className="py-2 pr-3 font-semibold">Zero results</th>
              <th className="py-2 pr-3 font-semibold">Errors</th>
              <th className="py-2 pr-3 font-semibold">Avg latency</th>
              <th className="py-2 pr-3 font-semibold">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={6}>
                  No AI search usage in this range.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId ?? "anonymous"}>
                  <td className="py-3 pr-3 font-medium text-slate-950">
                    {row.userId ?? "Anonymous"}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.searches.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.zeroResultSearches.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.errorSearches.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.averageLatencyMs === null ? "-" : `${Math.round(row.averageLatencyMs).toLocaleString()}ms`}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{currency.format(row.estimatedCost)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
