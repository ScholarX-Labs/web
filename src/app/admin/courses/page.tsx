"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminCourses } from "@/hooks/admin/use-admin-courses";
import { formatDate, statusColor, statusLabel, truncate } from "@/lib/admin/admin-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminCoursesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminCourses({ page, search, limit: 20 });
  const items = ((data as { items?: unknown[] })?.items ?? []) as Record<string, unknown>[];
  const pagination = (data as { pagination?: { page: number; pages: number; total: number } })?.pagination ?? { page: 1, pages: 1, total: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
        <Link href="/admin/courses/new" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
          Create Course
        </Link>
      </div>

      <div className="mb-4">
        <Input placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs" />
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>}
      {error && <p className="text-red-500">Failed to load courses.</p>}
      {!isLoading && !error && items.length === 0 && <p className="text-gray-500">No courses found.</p>}

      {items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Title</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Price</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Created</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((course: Record<string, unknown>) => (
                <tr key={String(course.id)} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <Link href={`/admin/courses/${course.id}`} className="hover:text-blue-600">{truncate(String(course.title ?? ""), 50)}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{String(course.category ?? "-")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={(statusColor(String(course.status ?? "")) === "green" ? "default" : "secondary") as "default" | "secondary" | "destructive" | "outline"}>
                      {statusLabel(String(course.status ?? ""))}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {course.price ? `$${Number(course.price).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(course.createdAt as string)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
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
