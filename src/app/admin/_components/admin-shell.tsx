"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { usePathname } from "next/navigation";
import { SIDEBAR_NAV } from "@/lib/admin/admin-constants";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="flex min-h-screen w-full bg-[#f8fafc]">
        {/* Background gradient for depth */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent pointer-events-none" />
        
        <AdminSidebar user={user} />
        
        <div className="flex flex-1 flex-col min-h-screen relative">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white/70 backdrop-blur-xl px-4 lg:px-8 transition-all duration-300">
            <SidebarTrigger className="lg:hidden" />
            
            <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
              <span className="hover:text-slate-900 transition-colors cursor-default">Admin</span>
              <ChevronRight className="size-3.5 text-slate-300" />
              <span className="text-slate-900 font-semibold tracking-tight">
                {getTitle(pathname)}
              </span>
            </nav>

            <div className="ml-auto flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/50 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white shadow-inner">
                  {user.name?.charAt(0)?.toUpperCase() ?? "A"}
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-semibold text-slate-900">{user.name ?? "Admin"}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Principal Admin</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-10 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
