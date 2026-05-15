import { createAdminDomain } from "@/domain/admin";
import { InquiriesTable } from "./_components/inquiries-table";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const domain = createAdminDomain();
  const result = await domain.inquiries.list({ page: 1, limit: 20, search: "" });
  const { items, pagination } = result as {
    items: Record<string, unknown>[];
    pagination: { page: number; pages: number; total: number };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inquiries</h2>
        <p className="text-muted-foreground">
          Manage course enrollment inquiries
        </p>
      </div>
      <InquiriesTable
        initialItems={items}
        initialPagination={pagination}
      />
    </div>
  );
}
