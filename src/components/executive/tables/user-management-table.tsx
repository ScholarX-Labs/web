import Link from "next/link";
import type { UserManagementRow } from "@/domain/executive/contracts/executive-read-repository.contract";

export type UserManagementTableProps = {
  rows: readonly UserManagementRow[];
};

export function UserManagementTable({ rows }: UserManagementTableProps) {
  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-labelledby="user-management-table"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="user-management-table" className="text-sm font-semibold text-slate-950">
          User management oversight
        </h2>
        <span className="text-xs font-medium uppercase text-slate-400">
          {rows.length} users
        </span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="py-2 pr-3 font-semibold">User</th>
              <th className="py-2 pr-3 font-semibold">Email</th>
              <th className="py-2 pr-3 font-semibold">Role</th>
              <th className="py-2 pr-3 font-semibold">Created</th>
              <th className="py-2 pr-3 font-semibold">Verified</th>
              <th className="py-2 pr-3 font-semibold">Banned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td className="py-4 pr-3 text-slate-500" colSpan={6}>
                  No users found for this range.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.userId}>
                  <td className="py-3 pr-3 font-medium text-slate-950">
                    <Link className="hover:text-blue-700" href={row.adminHref}>
                      {row.name ?? row.userId}
                    </Link>
                  </td>
                  <td className="py-3 pr-3 text-slate-600">{row.email ?? "-"}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.role}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.createdAt.slice(0, 10)}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.isEmailVerified ? "Yes" : "No"}</td>
                  <td className="py-3 pr-3 text-slate-600">{row.isBanned ? "Yes" : "No"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
