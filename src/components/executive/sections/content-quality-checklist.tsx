import type { ContentQualityChecklistRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type ContentQualityChecklistProps = {
  rows: readonly ContentQualityChecklistRow[];
};

function formatFlag(flag: string): string {
  return flag
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function ContentQualityChecklist({ rows }: ContentQualityChecklistProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="content-quality-checklist"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="content-quality-checklist" className="text-sm font-semibold text-slate-950">
          Content quality checklist
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} lessons
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Lesson</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 font-semibold">Video</th>
              <th className="py-2 pr-3 font-semibold">Updated</th>
              <th className="py-2 pr-3 font-semibold">Drop-off</th>
              <th className="py-2 pr-3 font-semibold">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={6}>
                  No lesson quality issues found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.lessonId}>
                  <td className="py-3 pr-3 font-medium text-slate-950">{row.title}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.status}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.hasVideo ? "Present" : "Missing"}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.updatedAt.slice(0, 10)}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.dropOffLabel ?? "-"}</td>
                  <td className="py-3 pr-3 text-slate-600">
                    {row.issueFlags.length === 0 ? (
                      <span className="text-slate-400">-</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {row.issueFlags.map((flag) => (
                          <span
                            key={flag}
                            className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                          >
                            {formatFlag(flag)}
                          </span>
                        ))}
                      </div>
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
