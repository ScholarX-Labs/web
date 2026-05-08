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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-3">
      <div className="flex gap-4 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function TableError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="size-8 text-destructive mb-3" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          <RefreshCw className="size-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

function TableEmpty({ message, description }: { message: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="size-8 text-muted-foreground/50 mb-3" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      )}
    </div>
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
  searchPlaceholder = "Search...",
  emptyMessage = "No data found.",
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

  if (loading) return <TableSkeleton rows={pageSize > 10 ? 6 : 3} />;
  if (error) return <TableError message={error} onRetry={onRetry} />;
  if (data.length === 0 && globalFilter === "")
    return <TableEmpty message={emptyMessage} description={emptyDescription} />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {searchable && (
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
        {toolbar && <div className="ml-auto flex items-center gap-2">{toolbar}</div>}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-3 text-sm font-medium text-muted-foreground"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp className="size-3.5" />,
                          desc: <ChevronDown className="size-3.5" />,
                        }[header.column.getIsSorted() as string] ?? (
                          <ChevronsUpDown className="size-3.5 opacity-30" />
                        )}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12">
                  <TableEmpty message="No results match your search." />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t mt-0">
        <p className="text-sm text-muted-foreground">
          {page !== undefined
            ? `Page ${page} of ${pageCount ?? "?"} (${total ?? "?"} total)`
            : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()} (${table.getFilteredRowModel().rows.length} rows)`}
        </p>
        <div className="flex gap-1">
          {page !== undefined && onPageChange ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </Button>
              {pageCount && pageCount > 1 && (
                <span className="flex items-center px-2 text-xs text-muted-foreground">
                  {page}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (pageCount ?? 1)}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
