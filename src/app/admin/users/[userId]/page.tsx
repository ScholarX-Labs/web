"use client";

import { use } from "react";
import Link from "next/link";
import { useAdminUser } from "@/hooks/admin/use-admin-users";
import { formatDate } from "@/lib/admin/admin-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { data: user, isLoading } = useAdminUser(userId);
  const u = user as Record<string, unknown> | undefined;

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>;
  if (!u) return <p className="text-red-500">User not found.</p>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/users" className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block">&larr; Back to Users</Link>
        <h2 className="text-2xl font-bold text-gray-900">{String(u.name ?? u.firstName ?? "")} {String(u.lastName ?? "")}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{String(u.email ?? "")}</span></div>
              <div><span className="text-gray-500">Role:</span> <Badge variant="secondary">{String(u.role ?? "")}</Badge></div>
              <div><span className="text-gray-500">Joined:</span> <span className="text-gray-900">{formatDate(u.createdAt as string)}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge variant={u.banned ? "destructive" : "default"}>{u.banned ? "Blocked" : "Active"}</Badge></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
