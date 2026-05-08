"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Inbox,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  page?: number;
  pageCount?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  toolbar?: React.ReactNode;
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4 pb-4 border-b border-slate-100">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-36 ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function TableError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center mb-4 ring-8 ring-rose-50/50">
        <AlertCircle className="size-8 text-rose-500" />
      </div>
      <p className="text-base font-bold text-slate-900">{message}</p>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">Something went wrong while fetching the latest data. Please try again.</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-6 rounded-full px-6" onClick={onRetry}>
          <RefreshCw className="size-3.5 mr-2" />
          Retry Connection
        </Button>
      )}
    </motion.div>
  );
}

function TableEmpty({ message, description }: { message: string; description?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 ring-8 ring-slate-50/30">
        <Inbox className="size-10 text-slate-200" />
      </div>
      <p className="text-lg font-bold text-slate-900">{message}</p>
      {description && (
        <p className="text-sm text-slate-400 mt-1 font-medium max-w-xs">{description}</p>
      )}
    </motion.div>
  );
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  error,
  onRetry,
  pageSize = 20,
  searchable = false,
  searchPlaceholder = "Search records...",
  emptyMessage = "No records found",
  emptyDescription,
  page,
  pageCount,
  total,
  onPageChange,
  toolbar,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const pagination = useMemo(
    () => (page !== undefined ? { pageIndex: page - 1, pageSize } : { pageIndex: 0, pageSize }),
    [page, pageSize],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: page !== undefined,
    pageCount: pageCount ?? -1,
  });

  if (loading) return <TableSkeleton rows={6} />;
  if (error) return <TableError message={error} onRetry={onRetry} />;
  
  const hasNoData = data.length === 0 && globalFilter === "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        {searchable && (
          <div className="relative max-w-sm w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 h-11 bg-white/50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all font-medium"
            />
          </div>
        )}
        {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-sm overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-100/80 bg-slate-50/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-5 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className={cn(
                            "flex items-center gap-1.5 hover:text-slate-900 transition-colors select-none",
                            header.column.getCanSort() && "cursor-pointer"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="opacity-50">
                              {{
                                asc: <ChevronUp className="size-3" />,
                                desc: <ChevronDown className="size-3" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronsUpDown className="size-3" />
                              )}
                            </span>
                          )}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              <AnimatePresence mode="popLayout">
                {hasNoData ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <TableEmpty message={emptyMessage} description={emptyDescription} />
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length}>
                      <TableEmpty message="No matching results" description="Try adjusting your search filters to find what you're looking for." />
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white transition-all duration-200"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-4 text-sm font-medium text-slate-600 transition-colors group-hover:text-slate-900">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white/40">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {page !== undefined
                ? `Page ${page} of ${pageCount ?? "?"}`
                : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
            </p>
            <div className="size-1 rounded-full bg-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {total ?? table.getFilteredRowModel().rows.length} Total Records
            </p>
          </div>
          
          <div className="flex gap-2">
            {page !== undefined && onPageChange ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-9 w-9 p-0 hover:bg-white hover:shadow-sm"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex items-center justify-center min-w-[36px] h-9 rounded-lg bg-white border border-slate-100 text-xs font-bold shadow-sm">
                  {page}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-9 w-9 p-0 hover:bg-white hover:shadow-sm"
                  disabled={page >= (pageCount ?? 1)}
                  onClick={() => onPageChange(page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-9 w-9 p-0 hover:bg-white hover:shadow-sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg h-9 w-9 p-0 hover:bg-white hover:shadow-sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
