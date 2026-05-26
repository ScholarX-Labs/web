export const dynamic = "force-dynamic";

import { createAdminDomain } from "@/domain/admin";
import { CoursesTable } from "./_components/courses-table";



export default async function AdminCoursesPage() {
  const domain = createAdminDomain();
  const result = await domain.courses.list({ page: 1, limit: 20, search: "" });
  const { items, pagination } = result as {
    items: Record<string, unknown>[];
    pagination: { page: number; pages: number; total: number };
  };

  return (
    <CoursesTable
      initialItems={items}
      initialPagination={pagination}
    />
  );
}
