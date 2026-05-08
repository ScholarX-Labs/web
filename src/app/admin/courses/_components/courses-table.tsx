"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminCourses } from "@/hooks/admin/use-admin-courses";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

interface Course {
  id: string;
  title: string;
  category: string | null;
  status: string;
  currentPrice: number | null;
  createdAt: string;
}

export function CoursesTable({
  initialItems,
  initialPagination,
}: {
  initialItems: Record<string, unknown>[];
  initialPagination: { page: number; pages: number; total: number };
}) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useAdminCourses(
    { page, search: "", limit: 20 },
    page === 1
      ? { items: initialItems, pagination: initialPagination }
      : undefined,
  );
  const items = ((data as { items?: Course[] })?.items ?? []) as Course[];
  const pagination =
    (data as { pagination?: { page: number; pages: number; total: number } })?.pagination ?? {
      page: 1,
      pages: 1,
      total: 0,
    };

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <Link
            href={`/admin/courses/${row.original.id}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.category ?? "—"}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "active"
              ? "default"
              : status === "draft" || status === "inactive"
                ? "secondary"
                : "outline";
          return <Badge variant={variant}>{statusLabel(status)}</Badge>;
        },
      },
      {
        accessorKey: "currentPrice",
        header: "Price",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.currentPrice != null
              ? `$${Number(row.original.currentPrice).toFixed(2)}`
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="text-right">
            <Link href={`/admin/courses/${row.original.id}`}>
              <Button variant="outline" size="sm">
                Edit
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your course catalog</p>
        </div>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="size-4 mr-1" />
            Create Course
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        error={error ? "Failed to load courses." : null}
        searchable
        searchPlaceholder="Search courses..."
        emptyMessage="No courses yet."
        emptyDescription="Create your first course to get started."
        page={pagination.page}
        pageCount={pagination.pages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
