"use client";

import { use } from "react";
import Link from "next/link";
import { useRevenueReport, useUsersReport, useCoursesReport } from "@/hooks/admin/use-admin-reports";
import { Card } from "@/components/ui/card";

export default function AdminReportDetailPage({ params }: { params: Promise<{ reportType: string }> }) {
  const { reportType } = use(params);
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const range = { from: thirtyDaysAgo, to: today };

  const query =
    reportType === "revenue" ? useRevenueReport(range) :
    reportType === "users" ? useUsersReport(range) :
    reportType === "courses" ? useCoursesReport(range) :
    null;

  const title = reportType.charAt(0).toUpperCase() + reportType.slice(1);

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/reports" className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block">&larr; Back to Reports</Link>
        <h2 className="text-2xl font-bold text-gray-900">{title} Report</h2>
      </div>
      <Card className="p-6">
        {query?.isLoading && <p className="text-gray-500">Loading...</p>}
        {query?.error && <p className="text-red-500">Failed to load report.</p>}
        {query?.data && (
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">{JSON.stringify(query.data, null, 2)}</pre>
        )}
      </Card>
    </div>
  );
}
