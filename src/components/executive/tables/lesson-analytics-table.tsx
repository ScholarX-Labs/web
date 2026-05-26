import type { LessonAnalyticsRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type LessonAnalyticsTableProps = {
  rows: readonly LessonAnalyticsRow[];
};

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function LessonAnalyticsTable({ rows }: LessonAnalyticsTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="lesson-analytics"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="lesson-analytics" className="text-sm font-semibold text-slate-950">
          Lesson analytics
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} lessons
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Lesson</th>
              <th className="py-2 pr-3 font-semibold">Viewers</th>
              <th className="py-2 pr-3 font-semibold">Completions</th>
              <th className="py-2 pr-3 font-semibold">Completion rate</th>
              <th className="py-2 pr-3 font-semibold">Avg watched</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.lessonId}>
                <td className="py-3 pr-3 font-medium text-slate-950">
                  {row.sortIndex}. {row.title}
                </td>
                <td className="py-3 pr-3 text-slate-600">{row.viewers.toLocaleString()}</td>
                <td className="py-3 pr-3 text-slate-600">{row.completions.toLocaleString()}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {row.completionRate === null ? "-" : percent.format(row.completionRate)}
                </td>
                <td className="py-3 pr-3 text-slate-600">
                  {row.averageWatchedPercentage === null
                    ? "-"
                    : `${row.averageWatchedPercentage.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
