"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminSubscriptions } from "@/hooks/admin/use-admin-subscriptions";
import { formatDate, statusColor, statusLabel } from "@/lib/admin/admin-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


export default function AdminSubscriptionsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminSubscriptions({ page, limit: 20, status: status || undefined });
  const items = ((data as { items?: unknown[] })?.items ?? []) as Record<string, unknown>[];
  const pagination = (data as { pagination?: { page: number; pages: number; total: number } })?.pagination ?? { page: 1, pages: 1, total: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Subscriptions</h2>
      </div>

      <div className="mb-4 flex gap-4">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>}
      {error && <p className="text-red-500">Failed to load subscriptions.</p>}
      {!isLoading && !error && items.length === 0 && <p className="text-gray-500">No subscriptions found.</p>}

      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Course</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Start</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">End</th>
              </tr>
            </thead>
            <tbody>
              {items.map((sub: Record<string, unknown>) => (
                <tr key={String(sub.id)} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link href={`/admin/subscriptions/${sub.id}`} className="hover:text-blue-600">
                      {String(sub.userId ?? "")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{String(sub.courseId ?? sub.courseName ?? "")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={(statusColor(String(sub.status ?? "")) === "green" ? "default" : statusColor(String(sub.status ?? "")) === "yellow" ? "secondary" : "destructive") as "default" | "secondary" | "destructive" | "outline"}>
                      {statusLabel(String(sub.status ?? ""))}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(sub.startDate as string)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(sub.endDate as string)}</td>
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
