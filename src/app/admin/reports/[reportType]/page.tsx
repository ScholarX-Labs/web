"use client";

import { use } from "react";
import Link from "next/link";
import { useRevenueReport, useUsersReport, useCoursesReport } from "@/hooks/admin/use-admin-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BarChart } from "lucide-react";

export default function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ reportType: string }>;
}) {
  const { reportType } = use(params);
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  const range = { from: thirtyDaysAgo, to: today };

  const query =
    reportType === "revenue"
      ? useRevenueReport(range)
      : reportType === "users"
        ? useUsersReport(range)
        : reportType === "courses"
          ? useCoursesReport(range)
          : null;

  const title = reportType.charAt(0).toUpperCase() + reportType.slice(1) + " Report";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/reports"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="size-3" />
          Back to Reports
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">
          {thirtyDaysAgo} to {today}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          {query?.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : query?.error ? (
            <div className="flex flex-col items-center py-8 text-center">
              <BarChart className="size-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-destructive">Failed to load report</p>
              <p className="text-xs text-muted-foreground mt-1">Please try adjusting the date range.</p>
            </div>
          ) : query?.data ? (
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-4 overflow-auto max-h-96">
              {JSON.stringify(query.data, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">Unknown report type.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
