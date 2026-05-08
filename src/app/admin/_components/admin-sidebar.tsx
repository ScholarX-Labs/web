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
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="size-4.5" />,
  BookOpen: <BookOpen className="size-4.5" />,
  Users: <Users className="size-4.5" />,
  CreditCard: <CreditCard className="size-4.5" />,
  MessageSquare: <MessageSquare className="size-4.5" />,
  BarChart: <BarChart className="size-4.5" />,
  Settings: <Settings className="size-4.5" />,
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
    <Sidebar collapsible="icon" variant="inset" className="border-r bg-white/50 backdrop-blur-xl">
      <SidebarHeader className="pt-6 pb-2">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-1 group-data-[collapsible=icon]:justify-center"
        >
          <div className="relative">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <Sparkles className="size-5 fill-white/20" />
            </div>
            <div className="absolute -bottom-1 -right-1 size-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">ScholarX</span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">Enterprise</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/admin") && pathname === "/admin"}
                  tooltip="Dashboard"
                  className={cn(
                    "relative h-11 transition-all duration-200",
                    isActive("/admin") && pathname === "/admin" 
                      ? "text-blue-600 font-semibold" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                  )}
                >
                  <Link href="/admin">
                    <LayoutDashboard className="size-4.5" />
                    <span>Dashboard</span>
                    {isActive("/admin") && pathname === "/admin" && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute left-[-12px] w-1.5 h-6 bg-blue-600 rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2 my-2 opacity-50" />

        {sectionGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {SIDEBAR_NAV.filter((item) => group.items.includes(item.label)).map((item) => {
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                        className={cn(
                          "relative h-11 transition-all duration-200",
                          active 
                            ? "text-blue-600 font-semibold bg-blue-50/50" 
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                        )}
                      >
                        <Link href={item.href}>
                          {iconMap[item.icon] ?? <LayoutDashboard className="size-4.5" />}
                          <span>{item.label}</span>
                          {active && (
                            <motion.div
                              layoutId="active-pill"
                              className="absolute left-[-12px] w-1.5 h-6 bg-blue-600 rounded-r-full shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 bg-slate-50/50 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3 mb-4 group-data-[collapsible=icon]:justify-center">
          <div className="relative shrink-0">
            <div className="flex size-9 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-900 ring-2 ring-slate-100">
              {user.name?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-blue-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-bold text-slate-900 truncate tracking-tight">{user.name ?? "Admin"}</p>
            <p className="text-[10px] text-slate-400 truncate font-medium">{user.email ?? ""}</p>
          </div>
        </div>
        <form action={signOut}>
          <SidebarMenuButton
            asChild
            size="sm"
            className="w-full justify-center bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 shadow-sm transition-all duration-200 group-data-[collapsible=icon]:p-0"
            tooltip="Sign out"
          >
            <button type="submit" className="flex items-center gap-2 font-semibold">
              <LogOut className="size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </button>
          </SidebarMenuButton>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
