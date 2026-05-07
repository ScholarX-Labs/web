"use client";

import { use } from "react";
import Link from "next/link";
import { useAdminSubscription } from "@/hooks/admin/use-admin-subscriptions";
import { formatDate } from "@/lib/admin/admin-utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AdminSubscriptionDetailPage({ params }: { params: Promise<{ subscriptionId: string }> }) {
  const { subscriptionId } = use(params);
  const { data, isLoading } = useAdminSubscription(subscriptionId);
  const s = data as Record<string, unknown> | undefined;

  if (isLoading) return <p className="text-gray-500">Loading...</p>;
  if (!s) return <p className="text-red-500">Subscription not found.</p>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/subscriptions" className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block">&larr; Back to Subscriptions</Link>
        <h2 className="text-2xl font-bold text-gray-900">Subscription {String(s.id ?? "").slice(0, 8)}...</h2>
      </div>
      <Card className="p-6 max-w-2xl">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">User ID:</span> <span className="text-gray-900">{String(s.userId ?? "")}</span></div>
          <div><span className="text-gray-500">Course ID:</span> <span className="text-gray-900">{String(s.courseId ?? "")}</span></div>
          <div><span className="text-gray-500">Status:</span> <Badge>{String(s.status ?? "")}</Badge></div>
          <div><span className="text-gray-500">Start:</span> <span className="text-gray-900">{formatDate(s.startDate as string)}</span></div>
          <div><span className="text-gray-500">End:</span> <span className="text-gray-900">{formatDate(s.endDate as string)}</span></div>
        </div>
      </Card>
    </div>
  );
}
