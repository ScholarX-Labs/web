"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminUsers, useBlockUser, useUnblockUser } from "@/hooks/admin/use-admin-users";
import { formatDate, statusColor, statusLabel } from "@/lib/admin/admin-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminUsers({ page, search, limit: 20 });
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  const users = (data as { items?: unknown[]; pagination?: { page: number; pages: number; total: number } }) ?? {};
  const items = users.items ?? [];
  const pagination = users.pagination ?? { page: 1, pages: 1, total: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>}

      {error && <p className="text-red-500">Failed to load users.</p>}

      {!isLoading && !error && items.length === 0 && (
        <p className="text-gray-500">No users found.</p>
      )}

      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Joined</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user: Record<string, unknown>) => (
                <tr key={String(user.id)} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link href={`/admin/users/${user.id}`} className="hover:text-blue-600">
                      {String(user.name ?? user.firstName ?? "")} {String(user.lastName ?? "")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{String(user.email ?? "")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColor(String(user.role ?? "")) as "default" | "secondary" | "destructive" | "outline"}>
                      {statusLabel(String(user.role ?? ""))}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.banned ? "destructive" : "secondary"}>
                      {user.banned ? "Blocked" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(user.createdAt as string)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      {user.banned ? (
                        <Button variant="outline" size="sm" onClick={() => unblockUser.mutate(String(user.id))}>
                          Unblock
                        </Button>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => blockUser.mutate({ id: String(user.id), data: {} })}>
                          Block
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages} ({pagination.total} total)</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
