"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useAdminUsers, useBlockUser, useUnblockUser } from "@/hooks/admin/use-admin-users";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ColumnDef } from "@tanstack/react-table";
import { ShieldBan, ShieldCheck } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
}

export function UsersTable({
  initialItems,
  initialPagination,
}: {
  initialItems: Record<string, unknown>[];
  initialPagination: { page: number; pages: number; total: number };
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  const { data, isLoading, error } = useAdminUsers(
    { page, search: debouncedSearch || undefined, limit: 20 },
    page === 1 && !debouncedSearch
      ? { items: initialItems as unknown[], pagination: initialPagination }
      : undefined,
  );
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const [blockDialog, setBlockDialog] = useState<{
    id: string;
    name: string;
    action: "block" | "unblock";
  } | null>(null);

  const users = (data as { items?: User[]; pagination?: { page: number; pages: number; total: number } }) ?? {};
  const items = users.items ?? [];
  const pagination = users.pagination ?? { page: 1, pages: 1, total: 0 };

  const handleConfirmBlock = async () => {
    if (!blockDialog) return;
    if (blockDialog.action === "block") {
      await blockUser.mutateAsync({ id: blockDialog.id, data: {} });
    } else {
      await unblockUser.mutateAsync(blockDialog.id);
    }
    setBlockDialog(null);
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const u = row.original;
          const displayName =
            u.name ??
            (`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unknown");
          return (
            <Link
              href={`/admin/users/${u.id}`}
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              {displayName}
            </Link>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.original.role;
          const variant =
            role === "admin"
              ? "default"
              : role === "instructor"
                ? "secondary"
                : "outline";
          return <Badge variant={variant}>{statusLabel(role)}</Badge>;
        },
      },
      {
        accessorKey: "banned",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.banned ? "destructive" : "secondary"}>
            {row.original.banned ? "Blocked" : "Active"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/admin/users/${row.original.id}`}>
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
            {row.original.banned ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setBlockDialog({
                    id: row.original.id,
                    name: row.original.name ?? "this user",
                    action: "unblock",
                  })
                }
              >
                <ShieldCheck className="size-3 mr-1" />
                Unblock
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  setBlockDialog({
                    id: row.original.id,
                    name: row.original.name ?? "this user",
                    action: "block",
                  })
                }
              >
                <ShieldBan className="size-3 mr-1" />
                Block
              </Button>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage platform users and their access
        </p>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading && items.length === 0}
        error={error ? "Failed to load users." : null}
        searchable
        searchPlaceholder="Search by name, email, role, phone, or user ID..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        emptyMessage="No users found."
        page={pagination.page}
        pageCount={pagination.pages}
        total={pagination.total}
        onPageChange={setPage}
      />

      <Dialog
        open={blockDialog !== null}
        onOpenChange={(open) => !open && setBlockDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blockDialog?.action === "block" ? "Block User" : "Unblock User"}
            </DialogTitle>
            <DialogDescription>
              {blockDialog?.action === "block"
                ? `Are you sure you want to block ${blockDialog?.name}? They will lose access to the platform.`
                : `Are you sure you want to unblock ${blockDialog?.name}? They will regain access to the platform.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={blockDialog?.action === "block" ? "destructive" : "default"}
              onClick={handleConfirmBlock}
              disabled={blockUser.isPending || unblockUser.isPending}
            >
              {blockDialog?.action === "block" ? "Block" : "Unblock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
