export const dynamic = 'force-dynamic';
import { createAdminDomain } from "@/domain/admin";
import { InquiriesTable } from "./_components/inquiries-table";

export default async function AdminInquiriesPage() {
  const domain = createAdminDomain();
  const result = await domain.inquiries.list({ page: 1, limit: 20 });
  const { items, pagination } = result as {
    items: Record<string, unknown>[];
    pagination: { page: number; pages: number; total: number };
  };

  return <InquiriesTable initialItems={items} initialPagination={pagination} />;
}
