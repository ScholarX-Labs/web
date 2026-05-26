import type { PublicImpactMetricGovernanceRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type PublicImpactMetricsTableProps = {
  metrics: readonly PublicImpactMetricGovernanceRow[];
};

const statusTone = {
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  pending_review: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  published: "bg-teal-50 text-teal-700 border-teal-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  expired: "bg-amber-50 text-amber-700 border-amber-200",
  manual_override: "bg-violet-50 text-violet-700 border-violet-200",
} as const satisfies Record<PublicImpactMetricGovernanceRow["approvalStatus"], string>;

export function PublicImpactMetricsTable({
  metrics,
}: PublicImpactMetricsTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="public-impact"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="public-impact" className="text-sm font-semibold text-slate-950">
          Public impact metrics
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {metrics.length} metrics
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Metric</th>
              <th className="py-2 pr-3 font-semibold">Value</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 font-semibold">Owner</th>
              <th className="py-2 pr-3 font-semibold">Freshness</th>
              <th className="py-2 pr-3 font-semibold">Source</th>
              <th className="py-2 pr-3 font-semibold">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {metrics.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={7}>
                  No public impact metrics configured.
                </td>
              </tr>
            ) : (
              metrics.map((metric) => (
                <tr key={metric.metricId}>
                  <td className="py-3 pr-3">
                    <p className="font-medium text-slate-950">{metric.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{metric.metricId}</p>
                    {metric.manualOverrideValue !== null ? (
                      <p className="mt-1 text-xs font-semibold text-violet-700">
                        Manual Override
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    <span className="font-medium text-slate-950">
                      {metric.value.toLocaleString()}
                    </span>
                    {metric.manualOverrideValue !== null ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Original {metric.computedValue.toLocaleString()}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusTone[metric.approvalStatus]}`}>
                      {metric.approvalStatus.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{metric.ownerId}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {metric.freshnessAt.slice(0, 10)}
                  </td>
                  <td className="max-w-xs py-3 pr-3 text-slate-600">
                    {metric.sourceDescription}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {metric.auditTrail.length === 0 ? "-" : `${metric.auditTrail.length} entries`}
                    {metric.rejectionReason ? (
                      <p className="mt-1 text-xs text-rose-600">{metric.rejectionReason}</p>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
