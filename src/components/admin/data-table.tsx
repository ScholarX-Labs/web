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
  searchValue?: string;
  onSearchChange?: (value: string) => void;
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
    <div className="space-y-6">
      <div className="flex gap-4 pb-6 border-b border-slate-200/60">
        <Skeleton className="h-5 w-40 rounded-xl" />
        <Skeleton className="h-5 w-32 rounded-xl" />
        <Skeleton className="h-5 w-28 rounded-xl" />
        <Skeleton className="h-5 w-44 rounded-xl ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2">
          <Skeleton className="h-14 w-full rounded-[20px]" />
        </div>
      ))}
    </div>
  );
}

function TableError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      className="flex flex-col items-center justify-center py-24 text-center px-6"
    >
      <div className="size-20 rounded-[28px] bg-rose-50 flex items-center justify-center mb-8 ring-8 ring-rose-50/30 shadow-inner">
        <AlertCircle className="size-10 text-rose-500" strokeWidth={2.5} />
      </div>
      <p className="text-xl font-[900] text-slate-900 tracking-tight">{message}</p>
      <p className="text-[13px] text-slate-400 mt-2 max-w-[280px] font-bold uppercase tracking-wide opacity-80 leading-relaxed">
        Synchronization failed. Please verify your connection status and attempt a protocol retry.
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          size="lg" 
          className="mt-10 rounded-[20px] px-10 h-14 font-black uppercase tracking-[0.2em] text-[11px] border-slate-200 hover:bg-slate-50 active:scale-95 transition-all" 
          onClick={onRetry}
        >
          <RefreshCw className="size-4 mr-3" />
          Retry Connection
        </Button>
      )}
    </motion.div>
  );
}

function TableEmpty({ message, description }: { message: string; description?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="flex flex-col items-center justify-center py-32 text-center px-6"
    >
      <div className="size-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 ring-1 ring-slate-100 shadow-inner">
        <Inbox className="size-12 text-slate-200" strokeWidth={1.5} />
      </div>
      <p className="text-2xl font-[900] text-slate-900 tracking-tight">{message}</p>
      {description && (
        <p className="text-[13px] text-slate-400 mt-3 font-bold uppercase tracking-widest max-w-[320px] opacity-70 leading-relaxed">
          {description}
        </p>
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
  searchValue,
  onSearchChange,
  emptyMessage = "Registry Empty",
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
  const [localPagination, setLocalPagination] = useState({ pageIndex: 0, pageSize });

  const pagination = useMemo(
    () => (page !== undefined ? { pageIndex: page - 1, pageSize } : { pageIndex: 0, pageSize }),
    [page, pageSize],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, pagination: page !== undefined ? pagination : localPagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: page !== undefined ? undefined : setLocalPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: page !== undefined,
    pageCount: pageCount ?? -1,
  });

  if (loading) return <TableSkeleton rows={8} />;
  if (error) return <TableError message={error} onRetry={onRetry} />;

  const effectiveSearchValue = searchValue ?? globalFilter;
  const hasNoData = data.length === 0 && effectiveSearchValue === "";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6 flex-wrap">
        {searchable && (
          <div className="relative max-w-md w-full group">
            <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none stroke-[2.5]" />
            <Input
              placeholder={searchPlaceholder}
              value={effectiveSearchValue}
              onChange={(e) => {
                const value = e.target.value;
                setGlobalFilter(value);
                onSearchChange?.(value);
              }}
              className="pl-12 h-14 bg-white/50 border-slate-200/80 focus:bg-white focus:ring-[12px] focus:ring-blue-500/5 rounded-[22px] transition-all font-bold text-[15px] shadow-sm shadow-slate-100/50"
            />
          </div>
        )}
        {toolbar && <div className="ml-auto flex items-center gap-3">{toolbar}</div>}
      </div>

      <div className="rounded-[32px] border border-slate-200/60 bg-white/70 backdrop-blur-3xl overflow-hidden shadow-[0_8px_30px_-4px_rgba(0,0,0,0.02)]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-slate-200/40 bg-slate-50/40">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left px-8 py-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className={cn(
                            "flex items-center gap-2 hover:text-slate-900 transition-colors select-none group/btn",
                            header.column.getCanSort() && "cursor-pointer"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300">
                              {{
                                asc: <ChevronUp className="size-3.5 text-blue-600 stroke-[3]" />,
                                desc: <ChevronDown className="size-3.5 text-blue-600 stroke-[3]" />,
                              }[header.column.getIsSorted() as string] ?? (
                                <ChevronsUpDown className="size-3.5 text-slate-300 stroke-[2.5]" />
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
            <tbody className="divide-y divide-slate-100/60">
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
                      <TableEmpty message="Zero Matches" description="Adjust your filters to synchronize with available registry data." />
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ delay: idx * 0.04, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="group hover:bg-white/95 transition-all duration-300 cursor-default"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-8 py-5 text-sm font-semibold text-slate-600 transition-all group-hover:text-slate-900">
                          <div className="group-hover:translate-x-0.5 transition-transform duration-500">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </td>
                      ))}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          <AnimatePresence mode="popLayout">
            {hasNoData ? (
              <TableEmpty message={emptyMessage} description={emptyDescription} />
            ) : table.getRowModel().rows.length === 0 ? (
              <TableEmpty message="Zero Matches" description="Adjust your filters to synchronize with available registry data." />
            ) : (
              <div className="divide-y divide-slate-100/60">
                {table.getRowModel().rows.map((row, idx) => {
                  const cells = row.getVisibleCells();
                  const firstCell = cells[0];
                  const lastCell = cells[cells.length - 1];
                  const middleCells = cells.slice(1, cells.length - 1);

                  return (
                    <motion.div
                      key={row.id + "-mobile"}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-6 space-y-6 bg-white/40 active:bg-white/80 transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          {flexRender(firstCell.column.columnDef.cell, firstCell.getContext())}
                        </div>
                        <div className="shrink-0">
                          {flexRender(lastCell.column.columnDef.cell, lastCell.getContext())}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 rounded-[24px] bg-slate-50/50 border border-slate-100/50 shadow-inner">
                        {middleCells.map((cell) => (
                          <div key={cell.id} className="space-y-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                              {typeof cell.column.columnDef.header === 'string' ? cell.column.columnDef.header : cell.column.id}
                            </p>
                            <div className="text-[13px] font-bold text-slate-900 tracking-tight">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                           <div className="size-1.5 rounded-full bg-blue-500/40" />
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Node {idx + 1}</span>
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono">{row.id.slice(0, 8)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-10 py-6 border-t border-slate-200/40 bg-white/40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/50 shadow-inner">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {page !== undefined
                  ? `Node ${page} / ${pageCount ?? "?"}`
                  : `Node ${table.getState().pagination.pageIndex + 1} / ${table.getPageCount()}`}
              </p>
            </div>
            <div className="size-1.5 rounded-full bg-slate-200" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {total ?? table.getFilteredRowModel().rows.length} Registry Units
            </p>
          </div>
          
          <div className="flex gap-3">
            {page !== undefined && onPageChange ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-10 w-10 p-0 hover:bg-white hover:shadow-md active:scale-90 transition-all border border-transparent hover:border-slate-100"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                >
                  <ChevronLeft className="size-4.5 stroke-[2.5]" />
                </Button>
                <div className="flex items-center justify-center min-w-[44px] h-10 rounded-xl bg-white border border-slate-200 text-[13px] font-black shadow-sm ring-4 ring-slate-100/50">
                  {page}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-10 w-10 p-0 hover:bg-white hover:shadow-md active:scale-90 transition-all border border-transparent hover:border-slate-100"
                  disabled={page >= (pageCount ?? 1)}
                  onClick={() => onPageChange(page + 1)}
                >
                  <ChevronRight className="size-4.5 stroke-[2.5]" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-10 w-10 p-0 hover:bg-white hover:shadow-md active:scale-90 transition-all border border-transparent hover:border-slate-100"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="size-4.5 stroke-[2.5]" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-10 w-10 p-0 hover:bg-white hover:shadow-md active:scale-90 transition-all border border-transparent hover:border-slate-100"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="size-4.5 stroke-[2.5]" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
