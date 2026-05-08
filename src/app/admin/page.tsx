"use client";

import { useAdminStats } from "@/hooks/admin/use-admin-stats";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, CreditCard, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats();
  const stats = data as Record<string, number> | undefined;

  const tiles = [
    {
      label: "Courses",
      value: stats?.courses ?? 0,
      icon: BookOpen,
      href: "/admin/courses",
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Users",
      value: stats?.users ?? 0,
      icon: Users,
      href: "/admin/users",
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      label: "Subscriptions",
      value: stats?.subscriptions ?? 0,
      icon: CreditCard,
      href: "/admin/subscriptions",
      color: "text-violet-600 bg-violet-100",
    },
    {
      label: "Inquiries",
      value: stats?.inquiries ?? 0,
      icon: MessageSquare,
      href: "/admin/inquiries",
      color: "text-amber-600 bg-amber-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your platform</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="block">
            <Card className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`flex size-10 items-center justify-center rounded-lg ${tile.color}`}>
                  <tile.icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{tile.label}</p>
                  <p className="text-2xl font-bold">
                    {isLoading ? (
                      <span className="inline-block w-8 h-6 bg-muted rounded animate-pulse" />
                    ) : (
                      tile.value
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-1">Quick Actions</h3>
          <p className="text-sm text-muted-foreground mb-4">Common admin tasks</p>
          <div className="space-y-2">
            <Link
              href="/admin/courses/new"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
            >
              <BookOpen className="size-4 text-muted-foreground" />
              <span>Create a new course</span>
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
            >
              <MessageSquare className="size-4 text-muted-foreground" />
              <span>View pending inquiries</span>
            </Link>
            <Link
              href="/admin/reports"
              className="flex items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted transition-colors"
            >
              <CreditCard className="size-4 text-muted-foreground" />
              <span>View reports & analytics</span>
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-base font-semibold mb-1">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mb-4">Latest platform activity</p>
          <p className="text-sm text-muted-foreground text-center py-8">
            Activity feed coming soon
          </p>
        </Card>
      </div>
    </div>
  );
}
