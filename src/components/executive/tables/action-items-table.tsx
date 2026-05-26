import type { ActionCenterItem } from "@/domain/executive/contracts/action-center-repository.contract";

export type ActionItemsTableProps = {
  items: readonly ActionCenterItem[];
};

const severityTone = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-blue-50 text-blue-700 border-blue-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
} as const satisfies Record<ActionCenterItem["severity"], string>;

export function ActionItemsTable({ items }: ActionItemsTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="action-items"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="action-items" className="text-sm font-semibold text-slate-950">
          Action items
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {items.length} open
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Item</th>
              <th className="py-2 pr-3 font-semibold">Severity</th>
              <th className="py-2 pr-3 font-semibold">Status</th>
              <th className="py-2 pr-3 font-semibold">Owner</th>
              <th className="py-2 pr-3 font-semibold">Due</th>
              <th className="py-2 pr-3 font-semibold">Last seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-3">
                  <p className="font-medium text-slate-950">{item.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                    {item.recommendedAction}
                  </p>
                </td>
                <td className="py-3 pr-3">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${severityTone[item.severity]}`}
                  >
                    {item.severity}
                  </span>
                </td>
                <td className="py-3 pr-3 text-slate-600">{item.status}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {item.assignedOwnerId ?? "Unassigned"}
                </td>
                <td className="py-3 pr-3 text-slate-600">
                  {item.dueAt
                    ? new Date(item.dueAt).toLocaleDateString("en-US", {
                        dateStyle: "medium",
                      })
                    : "-"}
                </td>
                <td className="py-3 pr-3 text-slate-600">
                  {new Date(item.lastSeenAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
