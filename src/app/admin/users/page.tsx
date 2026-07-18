export const dynamic = "force-dynamic";

import { createAdminDomain } from "@/domain/admin";
import { UsersTable } from "./_components/users-table";

export default async function AdminUsersPage() {
  const domain = createAdminDomain();
  const result = await domain.users.list({ page: 1, limit: 20, search: "" });
  const { items, pagination } = result as {
    items: Record<string, unknown>[];
    pagination: { page: number; pages: number; total: number };
  };

  return <UsersTable initialItems={items} initialPagination={pagination} />;
}
