"use client";

import { use } from "react";
import Link from "next/link";
import { useAdminInquiry } from "@/hooks/admin/use-admin-inquiries";
import { formatDateTime } from "@/lib/admin/admin-utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AdminInquiryDetailPage({ params }: { params: Promise<{ inquiryId: string }> }) {
  const { inquiryId } = use(params);
  const { data, isLoading } = useAdminInquiry(inquiryId);
  const i = data as Record<string, unknown> | undefined;

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!i) return <p className="text-red-500">Inquiry not found.</p>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/inquiries" className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block">&larr; Back to Inquiries</Link>
        <h2 className="text-2xl font-bold text-gray-900">{String(i.subject ?? "Inquiry")}</h2>
      </div>
      <Card className="p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="text-gray-900">{String(i.name ?? "")}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{String(i.email ?? "")}</span></div>
          <div><span className="text-gray-500">Status:</span> <Badge>{String(i.status ?? "")}</Badge></div>
          <div><span className="text-gray-500">Date:</span> <span className="text-gray-900">{formatDateTime(i.createdAt as string)}</span></div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Message</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{String(i.message ?? "")}</p>
        </div>
      </Card>
    </div>
  );
}
