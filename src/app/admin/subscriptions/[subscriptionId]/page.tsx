"use client";
export const dynamic = "force-dynamic";

import { use } from "react";
import Link from "next/link";
import { useAdminSubscription } from "@/hooks/admin/use-admin-subscriptions";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard } from "lucide-react";

export default function AdminSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>;
}) {
  const { subscriptionId } = use(params);
  const { data, isLoading } = useAdminSubscription(subscriptionId);
  const s = data as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full max-w-2xl" />
      </div>
    );
  }

  if (!s) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <CreditCard className="size-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold">Subscription not found</h2>
        <p className="text-sm text-muted-foreground mt-1">The subscription you are looking for does not exist.</p>
        <Link href="/admin/subscriptions">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-3 mr-1" />
            Back to Subscriptions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/subscriptions"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="size-3" />
          Back to Subscriptions
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          Subscription {String(s.id ?? "").slice(0, 8)}...
        </h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">User ID</p>
              <p className="font-medium font-mono text-xs mt-0.5">{String(s.userId ?? "")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Course ID</p>
              <p className="font-medium font-mono text-xs mt-0.5">{String(s.courseId ?? "")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Status</p>
              <Badge className="mt-0.5" variant={String(s.status ?? "") === "active" ? "default" : "secondary"}>
                {statusLabel(String(s.status ?? ""))}
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Start Date</p>
              <p className="font-medium mt-0.5">{formatDate(s.startDate as string)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">End Date</p>
              <p className="font-medium mt-0.5">{formatDate(s.endDate as string)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
