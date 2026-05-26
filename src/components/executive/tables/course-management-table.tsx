import Link from "next/link";
import type { CourseManagementRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type CourseManagementTableProps = {
  rows: readonly CourseManagementRow[];
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function CourseManagementTable({ rows }: CourseManagementTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="course-management-table"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="course-management-table" className="text-sm font-semibold text-slate-950">
          Course management oversight
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
              <th className="py-2 pr-3 font-semibold">Owner</th>
              <th className="py-2 pr-3 font-semibold">Lessons</th>
              <th className="py-2 pr-3 font-semibold">Enrollments</th>
              <th className="py-2 pr-3 font-semibold">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={7}>
                  No courses found for this range.
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
                  <td className="py-3 pr-3 text-slate-600">{row.status}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.ownerId ?? "Unassigned"}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.lessons.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.enrollments.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.completionRate === null ? "-" : percent.format(row.completionRate)}
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
