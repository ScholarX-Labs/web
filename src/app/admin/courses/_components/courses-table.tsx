"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminCourses } from "@/hooks/admin/use-admin-courses";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Edit2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/lib/course-categories";

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
        header: "Course Detail",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/admin/courses/${row.original.id}`}
              className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
            >
              {row.original.title}
            </Link>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              ID: {row.original.id.slice(0, 8)}...
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const style = getCategoryStyle(row.original.category);
          const Icon = style.icon;
          return (
            <div className="flex items-center gap-2">
              <Icon className={cn("w-3.5 h-3.5", style.text)} />
              <span className={cn("font-semibold", style.text)}>
                {row.original.category ?? "Uncategorized"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const config: Record<string, { variant: "default" | "secondary" | "outline", className: string }> = {
            active: { variant: "default", className: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
            draft: { variant: "secondary", className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200" },
            inactive: { variant: "outline", className: "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100" },
          };
          const style = config[status] || config.draft;
          return (
            <Badge 
              variant={style.variant} 
              className={`rounded-full px-3 py-0.5 font-bold uppercase tracking-tighter text-[10px] border transition-colors ${style.className}`}
            >
              {statusLabel(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "currentPrice",
        header: "Pricing",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">$</span>
            <span className="font-bold text-slate-900">
              {row.original.currentPrice != null
                ? Number(row.original.currentPrice).toFixed(2)
                : "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-slate-900 font-medium">{formatDate(row.original.createdAt)}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Registered Date</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/admin/courses/${row.original.id}`}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Edit2 className="size-3.5" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <ExternalLink className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Courses</h1>
          <p className="text-slate-500 font-medium mt-1">Manage and organize your platform's curriculum</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Link href="/admin/courses/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-11 font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              <Plus className="size-4 mr-2" />
              Build Course
            </Button>
          </Link>
        </motion.div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        error={error ? "Failed to synchronize courses." : null}
        searchable
        searchPlaceholder="Filter by course name or category..."
        emptyMessage="Curriculum is empty"
        emptyDescription="Your platform hasn't registered any courses yet. Start by creating your first learning path."
        page={pagination.page}
        pageCount={pagination.pages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
