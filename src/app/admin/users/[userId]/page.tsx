
"use client";
export const dynamic = "force-dynamic";

import { use } from "react";
import Link from "next/link";
import { useAdminUser } from "@/hooks/admin/use-admin-users";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Calendar, Shield, User } from "lucide-react";

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { data: user, isLoading } = useAdminUser(userId);
  const u = user as Record<string, unknown> | undefined;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!u) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <User className="size-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-lg font-semibold">User not found</h2>
        <p className="text-sm text-muted-foreground mt-1">The user you are looking for does not exist.</p>
        <Link href="/admin/users">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="size-3 mr-1" />
            Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  const displayName = String(u.name ?? u.firstName ?? "") + (u.lastName ? ` ${u.lastName}` : "");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="size-3" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{displayName || "User"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium">{String(u.email ?? "")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Role</p>
                    <Badge variant="secondary" className="mt-0.5">
                      {statusLabel(String(u.role ?? ""))}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Joined</p>
                    <p className="font-medium">{formatDate(u.createdAt as string)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="size-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge variant={u.banned ? "destructive" : "default"} className="mt-0.5">
                      {u.banned ? "Blocked" : "Active"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-6">
                Enrollment history coming soon.
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-6">
                Activity log coming soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
