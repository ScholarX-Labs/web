"use client";

import { useState, useEffect } from "react";
import { useAdminEnrollmentsByCourse } from "@/hooks/admin/use-admin-enrollments";
import { formatDate } from "@/lib/admin/admin-utils";
import { DataTable } from "@/components/admin/data-table";
import { EnrollUserModal } from "@/components/admin/enroll-user-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";

interface EnrollmentRecord {
  id: string;
  userId: string;
  courseId: string;
  amount: number | null;
  paymentMethod: string | null;
  paymentId: string | null;
  status: string | null;
  isActive: boolean | null;
  enrolledAt: string | null;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export function EnrollmentsTab({ courseId }: { courseId: string }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, error } = useAdminEnrollmentsByCourse(courseId, {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
  });

  const enrollments = (data as { items?: EnrollmentRecord[]; pagination?: { page: number; pages: number; total: number } }) ?? {};
  const items = enrollments.items ?? [];
  const pagination = enrollments.pagination ?? { page: 1, pages: 1, total: 0 };

  const columns: ColumnDef<EnrollmentRecord>[] = [
    {
      accessorFn: (row) => `${row.user.firstName ?? ""} ${row.user.lastName ?? ""}`.trim(),
      id: "name",
      header: "Student",
      cell: ({ row }) => {
        const name = `${row.original.user.firstName ?? ""} ${row.original.user.lastName ?? ""}`.trim();
        return <span className="font-medium">{name || "Unknown"}</span>;
      },
    },
    {
      accessorFn: (row) => row.user.email,
      id: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.user.email}</span>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span>{row.original.amount != null ? `$${(row.original.amount / 100).toFixed(2)}` : "-"}</span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => {
        const method = row.original.paymentMethod;
        if (!method) return <span className="text-muted-foreground">-</span>;
        return (
          <Badge variant="outline" className="capitalize">
            {method.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = status === "active" ? "secondary" : status === "cancelled" ? "destructive" : "outline";
        return <Badge variant={variant}>{status ?? "unknown"}</Badge>;
      },
    },
    {
      accessorKey: "enrolledAt",
      header: "Enrolled",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.enrolledAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Enrollments</h3>
          <p className="text-sm text-muted-foreground">
            Manage student enrollments and payment records
          </p>
        </div>
        <Button onClick={() => setEnrollModalOpen(true)}>
          <UserPlus className="size-4 mr-2" />
          Enroll User
        </Button>
      </div>

      <EnrollUserModal
        open={enrollModalOpen}
        onOpenChange={setEnrollModalOpen}
        courseId={courseId}
      />

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading && items.length === 0}
        error={error ? "Failed to load enrollments." : null}
        searchable
        searchPlaceholder="Search by name or email..."
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        emptyMessage="No enrollments found."
        page={pagination.page}
        pageCount={pagination.pages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
