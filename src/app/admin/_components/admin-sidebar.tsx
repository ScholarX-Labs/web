"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SIDEBAR_NAV } from "@/lib/admin/admin-constants";
import { signOut } from "@/app/admin/_actions/signout";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CreditCard,
  MessageSquare,
  BarChart,
  Settings,
  LogOut,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="size-4" />,
  BookOpen: <BookOpen className="size-4" />,
  Users: <Users className="size-4" />,
  CreditCard: <CreditCard className="size-4" />,
  MessageSquare: <MessageSquare className="size-4" />,
  BarChart: <BarChart className="size-4" />,
  Settings: <Settings className="size-4" />,
};

const sectionGroups = [
  { label: "Content", items: ["Courses"] },
  { label: "People", items: ["Users"] },
  { label: "Commerce", items: ["Subscriptions"] },
  { label: "Operations", items: ["Inquiries"] },
  { label: "Analytics", items: ["Reports"] },
  { label: "System", items: ["Settings"] },
];

export function AdminSidebar({ user }: { user: { name?: string | null; email?: string | null } }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          href="/admin"
          className="flex items-center gap-2 px-2 py-1 text-sm font-semibold group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            SX
          </div>
          <span className="group-data-[collapsible=icon]:hidden">ScholarX Admin</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/admin") && pathname === "/admin"}
                  tooltip="Dashboard"
                >
                  <Link href="/admin">
                    <LayoutDashboard className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {sectionGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {SIDEBAR_NAV.filter((item) => group.items.includes(item.label)).map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        {iconMap[item.icon] ?? <LayoutDashboard className="size-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {user.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium truncate">{user.name ?? "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email ?? ""}</p>
          </div>
        </div>
        <form action={signOut}>
          <SidebarMenuButton
            asChild
            size="sm"
            variant="outline"
            className="text-muted-foreground hover:text-destructive"
            tooltip="Sign out"
          >
            <button type="submit">
              <LogOut className="size-4" />
              <span>Sign out</span>
            </button>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
