import Link from "next/link";
import type { CourseLeaderboardRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type CourseLeaderboardTableProps = {
  rows: readonly CourseLeaderboardRow[];
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

export function CourseLeaderboardTable({ rows }: CourseLeaderboardTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="course-leaderboard"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="course-leaderboard" className="text-sm font-semibold text-slate-950">
          Course leaderboard
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} courses
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Course</th>
              <th className="py-2 pr-3 font-semibold">Category</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 font-semibold">Flags</th>
              <th className="py-2 pr-3 font-semibold">Enrollments</th>
              <th className="py-2 pr-3 font-semibold">Completion</th>
              <th className="py-2 pr-3 font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.courseId}>
                <td className="py-3 pr-3 font-medium text-slate-950">
                  <Link className="hover:text-blue-700" href={`/admin/courses/${row.courseId}`}>
                    {row.title}
                  </Link>
                </td>
                <td className="py-3 pr-3 text-slate-600">{row.category}</td>
                <td className="py-3 pr-3 text-slate-600">{row.status}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {row.qualityFlags.length === 0 ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {row.qualityFlags.map((flag) => (
                        <span
                          key={flag}
                          className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
                        >
                          {flag
                            .split("_")
                            .map((part) => part[0].toUpperCase() + part.slice(1))
                            .join(" ")}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3 pr-3 text-slate-600">{row.enrollments.toLocaleString()}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {row.completionRate === null ? "-" : percent.format(row.completionRate)}
                </td>
                <td className="py-3 pr-3 text-slate-600">{currency.format(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
