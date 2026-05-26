import type { TechnicalAuditRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type AdminAuditTableProps = {
  rows: readonly TechnicalAuditRow[];
};

export function AdminAuditTable({ rows }: AdminAuditTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="admin-audit-log"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="admin-audit-log" className="text-sm font-semibold text-slate-950">
          Admin audit log
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} events
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">Action</th>
              <th className="py-2 pr-3 font-semibold">Entity</th>
              <th className="py-2 pr-3 font-semibold">Admin</th>
              <th className="py-2 pr-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-3 pr-3 font-medium text-slate-950">{row.action}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {row.entityType}
                  {row.entityId ? `:${row.entityId}` : ""}
                </td>
                <td className="py-3 pr-3 text-slate-600">{row.adminId}</td>
                <td className="py-3 pr-3 text-slate-600">
                  {new Date(row.createdAt).toLocaleString("en-US", {
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
