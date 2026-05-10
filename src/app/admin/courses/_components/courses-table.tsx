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
  slug: string | null;
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
        header: "Entity Identity",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Link
              href={`/admin/courses/${row.original.id}`}
              className="font-[900] text-[15px] text-slate-900 hover:text-blue-600 transition-colors tracking-tight"
            >
              {row.original.title}
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-1.5 py-0.5 rounded-md">
                CID: {row.original.id.slice(0, 8)}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Sector",
        cell: ({ row }) => {
          const style = getCategoryStyle(row.original.category);
          const Icon = style.icon;
          return (
            <div className="flex items-center gap-2.5">
              <div className={cn("size-8 rounded-xl flex items-center justify-center ring-1 ring-inset", style.bg, "ring-black/5 shadow-sm")}>
                <Icon className={cn("size-4", style.text)} />
              </div>
              <span className={cn("font-bold text-[13px] tracking-tight", style.text)}>
                {row.original.category ?? "General"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Lifecycle",
        cell: ({ row }) => {
          const status = row.original.status;
          const config: Record<string, { variant: "default" | "secondary" | "outline", className: string }> = {
            active: { variant: "default", className: "bg-emerald-50 text-emerald-700 border-emerald-100/60 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.2)]" },
            draft: { variant: "secondary", className: "bg-slate-100 text-slate-600 border-slate-200/60" },
            inactive: { variant: "outline", className: "bg-rose-50 text-rose-700 border-rose-100/60 shadow-[0_2px_10px_-4px_rgba(244,63,94,0.2)]" },
          };
          const style = config[status] || config.draft;
          return (
            <Badge 
              variant={style.variant} 
              className={cn("rounded-full px-4 py-1 font-[900] uppercase tracking-[0.1em] text-[10px] border transition-all active:scale-95 cursor-default", style.className)}
            >
              {statusLabel(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "currentPrice",
        header: "Valuation",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 font-[900] text-xs">$</span>
            <span className="font-black text-slate-900 text-[15px] tracking-tight">
              {row.original.currentPrice != null
                ? Number(row.original.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })
                : "0.00"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Synchronized",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-slate-900 font-bold text-[13px] tracking-tight">{formatDate(row.original.createdAt)}</span>
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">Registry Date</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3 px-2">
            <Link href={`/admin/courses/${row.original.id}`}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-90 border border-transparent hover:border-blue-100 shadow-sm hover:shadow-md"
              >
                <Edit2 className="size-4 stroke-[2.5]" />
              </Button>
            </Link>
            {row.original.slug && (
              <Link href={`/courses/${row.original.slug}`} target="_blank">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-90 border border-transparent hover:border-emerald-100 shadow-sm hover:shadow-md"
                >
                  <ExternalLink className="size-4 stroke-[2.5]" />
                </Button>
              </Link>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-2">
        <motion.div
          initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          className="space-y-1.5"
        >
          <div className="w-fit px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">
            Asset Registry
          </div>
          <h1 className="text-4xl font-[900] tracking-[-0.04em] text-slate-900">Curriculum Nodes</h1>
          <p className="text-slate-400 font-semibold tracking-tight">Manage and sequence the platform&apos;s architectural knowledge base.</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        >
          <Link href="/admin/courses/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[22px] px-8 h-14 font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_8px_24px_-4px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_32px_-4px_rgba(37,99,235,0.4)] transition-all active:scale-95 border-b-4 border-blue-800">
              <Plus className="size-4 mr-3 stroke-[3]" />
              Initialize Node
            </Button>
          </Link>
        </motion.div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        error={error ? "System synchronization failure." : null}
        searchable
        searchPlaceholder="Filter registry by identity or sector..."
        emptyMessage="Registry Offline"
        emptyDescription="Your architectural knowledge base is currently void. Initialize your first curriculum node to begin synchronization."
        page={pagination.page}
        pageCount={pagination.pages}
        total={pagination.total}
        onPageChange={setPage}
      />
    </div>
  );
}
