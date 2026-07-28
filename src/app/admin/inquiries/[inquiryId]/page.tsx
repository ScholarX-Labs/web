
"use client";
export const dynamic = "force-dynamic";

import { use } from "react";
import Link from "next/link";
import { useAdminInquiry, useUpdateInquiryStatus } from "@/hooks/admin/use-admin-inquiries";
import { formatDateTime, statusLabel } from "@/lib/admin/admin-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { INQUIRY_STATUS_OPTIONS } from "@/lib/admin/admin-constants";

export default function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ inquiryId: string }>;
}) {
  const { inquiryId } = use(params);
  const { data, isLoading } = useAdminInquiry(inquiryId);
  const updateStatus = useUpdateInquiryStatus();
  const i = data as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    );
  }

  if (!i) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="size-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold">Inquiry not found</h2>
        <p className="text-sm text-muted-foreground mt-1">The inquiry you are looking for does not exist.</p>
        <Link href="/admin/inquiries">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-3 mr-1" />
            Back to Inquiries
          </Button>
        </Link>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: inquiryId, data: { status: newStatus } });
      toast.success(`Inquiry marked as ${statusLabel(newStatus).toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/inquiries"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="size-3" />
          Back to Inquiries
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{String(i.subject ?? "Inquiry")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {String(i.message ?? "No message content.")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{String(i.name ?? "")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <a href={`mailto:${i.email}`} className="text-primary hover:underline">
                  {String(i.email ?? "")}
                </a>
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge
                variant={
                  String(i.status ?? "") === "resolved"
                    ? "default"
                    : String(i.status ?? "") === "closed"
                      ? "outline"
                      : "secondary"
                }
              >
                {statusLabel(String(i.status ?? ""))}
              </Badge>
              <div className="flex flex-col gap-1.5">
                {INQUIRY_STATUS_OPTIONS.map(
                  (opt) =>
                    opt.value !== i.status && (
                      <Button
                        key={opt.value}
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(opt.value)}
                        disabled={updateStatus.isPending}
                      >
                        Mark as {opt.label}
                      </Button>
                    ),
                )}
              </div>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(i.createdAt as string)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
