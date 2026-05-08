"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { usePathname } from "next/navigation";
import { SIDEBAR_NAV } from "@/lib/admin/admin-constants";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function getTitle(pathname: string): string {
  for (const item of SIDEBAR_NAV) {
    if (pathname.startsWith(item.href)) {
      if (pathname === item.href) return item.label;
      const rest = pathname.replace(item.href, "").replace(/^\//, "");
      if (rest === "new") return `New ${item.label.slice(0, -1)}`;
      return `${item.label} / ${rest.charAt(0).toUpperCase() + rest.slice(1).replace(/-/g, " ")}`;
    }
  }
  return "Admin";
}

export function AdminShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AdminSidebar user={user} />
        <div className="flex flex-1 flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="lg:hidden" />
            <nav className="flex items-center gap-1 text-sm text-muted-foreground">
              {[{ label: "Admin" }, { label: getTitle(pathname) }].map((crumb, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3" />}
                  <span className={cn(i === arr.length - 1 && "text-foreground font-medium")}>
                    {crumb.label}
                  </span>
                </span>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {user.name?.charAt(0)?.toUpperCase() ?? "A"}
                </div>
                <span className="hidden md:inline truncate max-w-[120px]">{user.name ?? "Admin"}</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
