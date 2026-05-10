"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { usePathname } from "next/navigation";
import { SIDEBAR_NAV } from "@/lib/admin/admin-constants";
import { 
  ChevronRight, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  BarChart, 
  MoreHorizontal,
  Settings,
  CreditCard,
  MessageSquare,
  X,
  LogOut,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, startTransition } from "react";
import { signOut } from "@/app/admin/_actions/signout";

const MOBILE_NAV_ITEMS = [
  { label: "Dash", href: "/admin", icon: LayoutDashboard },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Stats", href: "/admin/reports", icon: BarChart },
];

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
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Auto-close 'More' menu on navigation
  useEffect(() => {
    startTransition(() => {
      setIsMoreOpen(false);
    });
  }, [pathname]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-[#f5f5f7] text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
        {/* Apple-style background layers */}
        <div className="fixed inset-0 bg-[radial-gradient(at_top_right,_rgba(37,99,235,0.05),_transparent_50%),_radial-gradient(at_bottom_left,_rgba(99,102,241,0.05),_transparent_50%)] pointer-events-none" />
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block border-r border-slate-200/60 h-screen sticky top-0">
          <AdminSidebar user={user} />
        </div>
        
        <div className="flex flex-1 flex-col min-h-screen relative">
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200/60 bg-white/70 backdrop-blur-2xl px-6 lg:px-10 transition-all duration-500">
            <nav className="flex items-center gap-3 text-[13px] text-slate-400 font-semibold tracking-tight">
              <span className="hover:text-slate-900 transition-colors cursor-pointer hidden sm:inline">Admin</span>
              <ChevronRight className="size-3 text-slate-300 hidden sm:inline" strokeWidth={3} />
              <span className="text-slate-900 font-[1000] tracking-tighter truncate max-w-[200px] sm:max-w-none text-base">
                {getTitle(pathname)}
              </span>
            </nav>

            <div className="ml-auto flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/40 border border-white/60 shadow-[0_2px_10px_-1px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.04)] hover:bg-white/60 group cursor-default">
                <div className="size-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-[10px] font-black text-white ring-4 ring-blue-500/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  {user.name?.charAt(0)?.toUpperCase() ?? "A"}
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-slate-900 leading-tight tracking-tight">{user.name ?? "Admin"}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.05em]">Principal</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-8 lg:p-12 relative z-10 pb-32 lg:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Floating Mobile/Tablet Navigation (Apple Style Bottom Bar) */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md lg:hidden">
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-2xl rounded-[32px] p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] border border-white/10 dark:border-slate-200 flex items-center justify-between relative overflow-hidden"
            >
              {MOBILE_NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-5 py-3 rounded-[24px] transition-all duration-500 relative z-10",
                      isActive ? "text-white dark:text-slate-900" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <item.icon className={cn("size-5", isActive ? "stroke-[2.5]" : "stroke-[2]")} />
                    <span className="text-[9px] font-black uppercase tracking-[0.1em]">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="mobile-nav-pill"
                        className="absolute inset-0 bg-blue-600 rounded-[24px] -z-10 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.4)]"
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      />
                    )}
                  </Link>
                );
              })}

              {/* More Trigger */}
              <button
                onClick={() => setIsMoreOpen(true)}
                className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-[24px] text-slate-500 hover:text-slate-300 transition-all duration-300"
              >
                <MoreHorizontal className="size-5" />
                <span className="text-[9px] font-black uppercase tracking-[0.1em]">More</span>
              </button>
            </motion.div>
          </div>

          {/* More Full-screen Overlay */}
          <AnimatePresence>
            {isMoreOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-xl lg:hidden flex flex-col p-8"
              >
                <div className="flex justify-between items-center mb-12">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                      <Zap className="size-5" />
                    </div>
                    <span className="text-xl font-[1000] text-white tracking-tighter uppercase">Operations</span>
                  </div>
                  <button 
                    onClick={() => setIsMoreOpen(false)}
                    className="size-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 flex-1 content-start">
                  {[
                    { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
                    { label: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
                    { label: "Settings", href: "/admin/settings", icon: Settings },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="bg-white/5 border border-white/10 rounded-[28px] p-6 flex flex-col gap-4 hover:bg-white/10 transition-all group"
                    >
                      <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <item.icon className="size-6 text-white" />
                      </div>
                      <span className="text-sm font-black text-white uppercase tracking-widest">{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-auto space-y-4">
                  <div className="p-6 rounded-[28px] bg-white/5 border border-white/5 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-black text-white">
                      {user.name?.charAt(0) ?? "A"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-black">{user.name}</span>
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Executive Admin</span>
                    </div>
                  </div>
                  <form action={signOut}>
                    <button className="w-full bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-[24px] h-16 font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-rose-600 hover:text-white transition-all">
                      <LogOut className="size-4" />
                      De-authorize Session
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SidebarProvider>
  );
}

