"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRevenueReport, useUsersReport, useCoursesReport } from "@/hooks/admin/use-admin-reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, DollarSign, ExternalLink } from "lucide-react";

export default function AdminReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const range = { from, to };

  const revenue = useRevenueReport(range);
  const users = useUsersReport(range);
  const courses = useCoursesReport(range);

  const reports = [
    {
      title: "Revenue",
      description: "Track earnings and financial metrics",
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-100",
      href: "/admin/reports/revenue",
      query: revenue,
    },
    {
      title: "Users",
      description: "User growth and engagement",
      icon: Users,
      color: "text-blue-600 bg-blue-100",
      href: "/admin/reports/users",
      query: users,
    },
    {
      title: "Courses",
      description: "Course performance metrics",
      icon: BookOpen,
      color: "text-violet-600 bg-violet-100",
      href: "/admin/reports/courses",
      query: courses,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Analytics and performance metrics</p>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1.5">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map(({ title, description, icon: Icon, color, href, query }) => (
          <Link key={title} href={href} className="block">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <CardTitle>{title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {query.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : query.error ? (
                  <p className="text-sm text-destructive">Failed to load data</p>
                ) : query.data ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">
                      {typeof query.data === "object"
                        ? Object.keys(query.data as Record<string, unknown>).length
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ExternalLink className="size-3" />
                      View detailed report
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
