import Link from "next/link";
import type { FinanceCoursePerformanceRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type CourseBusinessPerformanceTableProps = {
  rows: readonly FinanceCoursePerformanceRow[];
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function flagLabel(flag: string): string {
  return flag
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function CourseBusinessPerformanceTable({ rows }: CourseBusinessPerformanceTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="course-business-performance"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="course-business-performance" className="text-sm font-semibold text-slate-950">
          Course business performance
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} courses
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Course</th>
              <th className="py-2 pr-3 font-semibold">Category</th>
              <th className="py-2 pr-3 font-semibold">Gross</th>
              <th className="py-2 pr-3 font-semibold">Refunded</th>
              <th className="py-2 pr-3 font-semibold">Net</th>
              <th className="py-2 pr-3 font-semibold">Enrollments</th>
              <th className="py-2 pr-3 font-semibold">Completions</th>
              <th className="py-2 pr-3 font-semibold">Completion</th>
              <th className="py-2 pr-3 font-semibold">Refund rate</th>
              <th className="py-2 pr-3 font-semibold">Support inquiries</th>
              <th className="py-2 pr-3 font-semibold">Profitability</th>
              <th className="py-2 pr-3 font-semibold">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={12}>
                  No finance data found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.courseId}>
                  <td className="py-3 pr-3 font-medium text-slate-950">
                    <Link className="hover:text-blue-700" href={row.adminHref}>
                      {row.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.category}</td>
                  <td className="py-3 pr-3 text-slate-600">{currency.format(row.grossRevenue)}</td>
                  <td className="py-3 pr-3 text-slate-600">{currency.format(row.refundedRevenue)}</td>
                  <td className="py-3 pr-3 text-slate-600">{currency.format(row.netRevenue)}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.enrollments.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.completions.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.completionRate === null ? "-" : percent.format(row.completionRate)}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.refundRate === null ? "-" : percent.format(row.refundRate)}
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.supportInquiryCount.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">{currency.format(row.profitabilityProxy)}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.highRefundRate ? (
                      <span className="inline-flex items-center rounded bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                        {flagLabel("high_refund_rate")}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
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
