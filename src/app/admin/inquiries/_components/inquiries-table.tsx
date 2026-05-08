"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminInquiries, useUpdateInquiryStatus } from "@/hooks/admin/use-admin-inquiries";
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
import { INQUIRY_STATUS_OPTIONS } from "@/lib/admin/admin-constants";
import { toast } from "sonner";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
}

export function InquiriesTable({
  initialItems,
  initialPagination,
}: {
  initialItems: Record<string, unknown>[];
  initialPagination: { page: number; pages: number; total: number };
}) {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAdminInquiries(
    { page, search: "", limit: 20, status: statusFilter || undefined },
    page === 1 && !statusFilter
      ? { items: initialItems as unknown[], pagination: initialPagination }
      : undefined,
  );
  const updateStatus = useUpdateInquiryStatus();
  const items = ((data as { items?: Inquiry[] })?.items ?? []) as Inquiry[];
  const pagination =
    (data as { pagination?: { page: number; pages: number; total: number } })?.pagination ?? {
      page: 1,
      pages: 1,
      total: 0,
    };

  const handleStatusChange = async (inquiryId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: inquiryId, data: { status: newStatus } });
      toast.success(`Inquiry marked as ${statusLabel(newStatus).toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const columns = useMemo<ColumnDef<Inquiry>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Link
            href={`/admin/inquiries/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
          <span className="text-muted-foreground max-w-[200px] truncate block">
            {row.original.subject}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          const variant =
            s === "resolved"
              ? "default"
              : s === "closed"
                ? "outline"
                : "secondary";
          return <Badge variant={variant}>{statusLabel(s)}</Badge>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const currentStatus = row.original.status;
          const nextStatus =
            currentStatus === "pending"
              ? "contacted"
              : currentStatus === "contacted"
                ? "resolved"
                : null;

          return (
            <div className="flex items-center justify-end gap-2">
              {nextStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(row.original.id, nextStatus)}
                  disabled={updateStatus.isPending}
                >
                  Mark {statusLabel(nextStatus)}
                </Button>
              )}
              <Link href={`/admin/inquiries/${row.original.id}`}>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </Link>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inquiries</h1>
        <p className="text-muted-foreground mt-1">
          Manage contact form submissions
        </p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        error={error ? "Failed to load inquiries." : null}
        onRetry={refetch}
        searchable
        searchPlaceholder="Search inquiries..."
        emptyMessage="No inquiries yet."
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
              {INQUIRY_STATUS_OPTIONS.map((opt) => (
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
