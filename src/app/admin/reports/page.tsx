"use client";

import { useState } from "react";
import { useRevenueReport, useUsersReport, useCoursesReport } from "@/hooks/admin/use-admin-reports";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminReportsPage() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const range = { from, to };

  const revenue = useRevenueReport(range);
  const users = useUsersReport(range);
  const courses = useCoursesReport(range);

  const reportTypes = [
    { title: "Revenue", query: revenue },
    { title: "Users", query: users },
    { title: "Courses", query: courses },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
      </div>

      <div className="mb-6 flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-48" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map(({ title, query }) => (
          <Card key={title} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            {query.isLoading && <p className="text-gray-500">Loading...</p>}
            {query.error && <p className="text-red-500">Failed to load.</p>}
            {query.data && (
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(query.data, null, 2)}
              </pre>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
