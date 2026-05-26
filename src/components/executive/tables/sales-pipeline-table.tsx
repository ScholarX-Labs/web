import Link from "next/link";
import type {
  InquiryPipelineRow,
  SalesSupportWorkloadRow,
} from "@/domain/executive/contracts/executive-read-repository.contract";

export type SalesPipelineTableProps = {
  rows: readonly InquiryPipelineRow[];
  workloadRows?: readonly SalesSupportWorkloadRow[];
};

const severityTone = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
} as const satisfies Record<InquiryPipelineRow["severity"], string>;

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function SalesPipelineTable({
  rows,
  workloadRows = [],
}: SalesPipelineTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="sales-pipeline"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="sales-pipeline" className="text-sm font-semibold text-slate-950">
          Sales & Support Pipeline
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} inquiries
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Course</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 font-semibold">Owner</th>
              <th className="py-2 pr-3 font-semibold">Source</th>
              <th className="py-2 pr-3 font-semibold">Age</th>
              <th className="py-2 pr-3 font-semibold">Follow-up due</th>
              <th className="py-2 pr-3 font-semibold">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={7}>
                  No inquiries found for the selected range.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.inquiryId}>
                  <td className="py-3 pr-3 font-medium text-slate-950">
                    <Link className="hover:text-blue-700" href={`/admin/courses/${row.courseId}`}>
                      {row.courseTitle}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.status}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.assignedOwnerId ?? "Unassigned"}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.sourceChannel}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.hoursSinceSubmission.toLocaleString()}h
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {new Date(row.nextFollowUpDueAt).toLocaleDateString("en-US", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${severityTone[row.severity]}`}>
                      {row.isSlaBreached ? "SLA Breach" : row.severity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {workloadRows.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workloadRows.map((row) => (
            <div key={row.ownerId ?? "unassigned"} className="rounded-md border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-slate-950">{row.ownerId ?? "Unassigned"}</p>
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {row.assignedInquiryCount} assigned
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {row.overdueFollowUpCount} overdue follow-ups
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Conversion {row.conversionRate === null ? "-" : percent.format(row.conversionRate)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
