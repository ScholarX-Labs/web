"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminSubscriptions } from "@/hooks/admin/use-admin-subscriptions";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColumnDef } from "@tanstack/react-table";
import { SUBSCRIPTION_STATUS_OPTIONS } from "@/lib/admin/admin-constants";

interface Subscription {
  id: string;
  userId: string;
  courseId: string;
  courseName?: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminSubscriptions({
    page,
    limit: 20,
    status: statusFilter || undefined,
  });
  const items = ((data as { items?: Subscription[] })?.items ?? []) as Subscription[];
  const pagination =
    (data as { pagination?: { page: number; pages: number; total: number } })?.pagination ?? {
      page: 1,
      pages: 1,
      total: 0,
    };

  const columns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      {
        accessorKey: "userId",
        header: "User",
        cell: ({ row }) => (
          <Link
            href={`/admin/subscriptions/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {row.original.userId.slice(0, 12)}...
          </Link>
        ),
      },
      {
        accessorKey: "courseName",
        header: "Course",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.courseName ?? row.original.courseId.slice(0, 12) + "..."}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          const variant =
            s === "active"
              ? "default"
              : s === "cancelled" || s === "expired"
                ? "destructive"
                : "secondary";
          return <Badge variant={variant}>{statusLabel(s)}</Badge>;
        },
      },
      {
        accessorKey: "startDate",
        header: "Start",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.startDate)}</span>
        ),
      },
      {
        accessorKey: "endDate",
        header: "End",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.endDate)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="text-right">
            <Link href={`/admin/subscriptions/${row.original.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Monitor course enrollments and subscriptions</p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        error={error ? "Failed to load subscriptions." : null}
        emptyMessage="No subscriptions found."
        page={pagination.page}
        pageCount={pagination.pages}
        total={pagination.total}
        onPageChange={setPage}
        toolbar={
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {SUBSCRIPTION_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
