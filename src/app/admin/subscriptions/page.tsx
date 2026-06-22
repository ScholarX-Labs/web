import { createAdminDomain } from "@/domain/admin";
import { SubscriptionsTable } from "./_components/subscriptions-table";

export default async function AdminSubscriptionsPage() {
  const domain = createAdminDomain();
  const result = await domain.subscriptions.list({ page: 1, limit: 20 });
  const { items, pagination } = result as {
    items: Record<string, unknown>[];
    pagination: { page: number; pages: number; total: number };
  };

  return (
    <SubscriptionsTable initialItems={items} initialPagination={pagination} />
  );
}

export const dynamic = "force-dynamic";
