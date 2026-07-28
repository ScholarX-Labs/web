"use client";
export const dynamic = "force-dynamic";

import { useAdminStats } from "@/hooks/admin/use-admin-stats";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, CreditCard, MessageSquare, ArrowRight, Zap, TrendingUp, Clock, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { UnsavePopup } from "@/components/ui/unsave-popup";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { useRouter } from "next/navigation";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } }
} as const;

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useAdminStats();
  const stats = data as Record<string, number> | undefined;
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setHasChanges(false);
  };

  const tiles = [
    {
      label: "Registry Total",
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      href: "/admin/courses",
      gradient: "from-blue-600 to-blue-700",
      shadow: "shadow-blue-500/25",
    },
    {
      label: "Active Nodes",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      href: "/admin/users",
      gradient: "from-indigo-600 to-indigo-700",
      shadow: "shadow-indigo-500/25",
    },
    {
      label: "Gross Capital",
      value: stats?.totalSubscriptions ?? 0,
      icon: CreditCard,
      href: "/admin/subscriptions",
      gradient: "from-slate-800 to-slate-900",
      shadow: "shadow-slate-900/25",
    },
    {
      label: "Direct Signal",
      value: stats?.totalInquiries ?? 0,
      icon: MessageSquare,
      href: "/admin/inquiries",
      gradient: "from-rose-600 to-rose-700",
      shadow: "shadow-rose-500/25",
    },
  ];

  const handleAction = (href: string, action?: () => void) => {
    if (action) action();
    router.push(href);
  };

  return (
    <div className="space-y-12 pb-32">
      <header className="flex items-end justify-between px-2">
        <div className="space-y-1.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            className="w-fit px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2"
          >
            System Overview
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            className="text-4xl font-[900] tracking-[-0.04em] text-slate-900"
          >
            Control Center
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 font-semibold tracking-tight"
          >
            Real-time analytics and platform orchestration.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.2 }}
          className="bg-white/40 backdrop-blur-xl p-3 rounded-[28px] border border-white shadow-xl shadow-slate-200/40"
        >
          <ProgressIndicator step={1} hideButtons />
        </motion.div>
      </header>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {tiles.map((tile) => (
          <motion.div key={tile.label} variants={item}>
            <Link href={tile.href} className="block group">
              <Card className="relative p-8 bg-white/70 backdrop-blur-3xl border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 overflow-hidden rounded-[32px]">
                <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-0 translate-x-4">
                  <ArrowRight className="size-5 text-slate-300" />
                </div>
                <div className="flex flex-col gap-8">
                  <div className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.gradient} ${tile.shadow} text-white transition-all group-hover:scale-110 duration-500 ring-8 ring-white/50 group-hover:ring-white`}>
                    <tile.icon className="size-7 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">{tile.label}</p>
                    <p className="text-5xl font-[900] text-slate-900 tracking-tighter">
                      {isLoading ? (
                        <span className="inline-block w-24 h-12 bg-slate-100 rounded-2xl animate-pulse" />
                      ) : (
                        tile.value.toLocaleString()
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full p-12 bg-white/70 backdrop-blur-3xl border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-[40px]">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl font-[900] text-slate-900 tracking-tight">Quick Actions</h3>
                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Protocol Shortcuts</p>
              </div>
              <div className="size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 ring-4 ring-blue-50/50 shadow-inner">
                <Zap className="size-6 fill-blue-600" />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "New Curriculum", desc: "Initialize learning node", href: "/admin/courses/new", icon: BookOpen, color: "blue" as const },
                { title: "Signal Inbox", desc: "Synchronize support data", href: "/admin/inquiries", icon: MessageSquare, color: "emerald" as const },
                { title: "Vault Reports", desc: "Audit financial streams", href: "/admin/reports", icon: TrendingUp, color: "violet" as const },
                { title: "Core Configuration", desc: "Modify system variables", href: "/admin/settings", icon: Settings, color: "slate" as const },
              ].map((action) => {
                const colorClasses: Record<string, string> = {
                  blue: "bg-blue-50 text-blue-600",
                  emerald: "bg-emerald-50 text-emerald-600",
                  violet: "bg-violet-50 text-violet-600",
                  slate: "bg-slate-50 text-slate-600",
                };
                return (
                <button
                  key={action.title}
                  onClick={() => handleAction(action.href)}
                  className="group flex flex-col gap-5 rounded-[32px] border border-slate-100/60 bg-white/50 p-8 text-sm text-left hover:bg-white hover:shadow-[0_20px_40px_-8px_rgba(0,0,0,0.04)] hover:border-white transition-all duration-500"
                >
                  <div className={`size-12 rounded-[14px] ${colorClasses[action.color] ?? "bg-slate-50 text-slate-600"} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm`}>
                    <action.icon className="size-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="block font-[900] text-slate-900 text-lg tracking-tight">{action.title}</span>
                    <span className="text-slate-400 font-bold text-xs mt-1 block uppercase tracking-wide opacity-80">{action.desc}</span>
                  </div>
                </button>
              );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full p-12 bg-white/70 backdrop-blur-3xl border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] rounded-[40px] flex flex-col">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-1">
                <h3 className="text-2xl font-[900] text-slate-900 tracking-tight">Active Pulse</h3>
                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest">Platform Events</p>
              </div>
              <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                <Clock className="size-6 stroke-[2.5]" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="size-32 rounded-[40px] bg-slate-50/50 flex items-center justify-center mb-8 ring-1 ring-slate-100 shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.05),_transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10"
                >
                  <Sparkles className="size-14 text-slate-200" strokeWidth={1} />
                </motion.div>
              </div>
              <p className="text-xl font-[900] text-slate-900 tracking-tight">Terminal Idle</p>
              <p className="text-[13px] text-slate-400 font-bold mt-3 max-w-[240px] leading-relaxed uppercase tracking-wide opacity-80">
                Awaiting incoming signals. System status: Optimal.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      <UnsavePopup 
        show={hasChanges} 
        onSave={handleSave} 
        onReset={() => setHasChanges(false)}
      >
        <span className="font-bold tracking-tight">Curriculum Registry Modification Detected</span>
      </UnsavePopup>
    </div>
  );
}
