"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminInquiries, useUpdateInquiryStatus } from "@/hooks/admin/use-admin-inquiries";
import { formatDate, statusColor, statusLabel } from "@/lib/admin/admin-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminInquiriesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminInquiries({ page, search, limit: 20, status: status || undefined });
  const updateStatus = useUpdateInquiryStatus();
  const items = ((data as { items?: unknown[] })?.items ?? []) as Record<string, unknown>[];
  const pagination = (data as { pagination?: { page: number; pages: number; total: number } })?.pagination ?? { page: 1, pages: 1, total: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Inquiries</h2>
      </div>

      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Search inquiries..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>}
      {error && <p className="text-red-500">Failed to load inquiries.</p>}
      {!isLoading && !error && items.length === 0 && <p className="text-gray-500">No inquiries found.</p>}

      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Subject</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((inq: Record<string, unknown>) => (
                <tr key={String(inq.id)} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link href={`/admin/inquiries/${inq.id}`} className="hover:text-blue-600">{String(inq.name ?? "")}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{String(inq.email ?? "")}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{String(inq.subject ?? "")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={(statusColor(String(inq.status ?? "")) === "green" ? "default" : "secondary") as "default" | "secondary" | "destructive" | "outline"}>
                      {statusLabel(String(inq.status ?? ""))}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(inq.createdAt as string)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/inquiries/${inq.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
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
