"use client";

import { useAdminStats } from "@/hooks/admin/use-admin-stats";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, CreditCard, MessageSquare, ArrowRight, Zap, TrendingUp, Clock, Save } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { UnsavePopup } from "@/components/ui/unsave-popup";
import ProgressIndicator from "@/components/ui/progress-indicator";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } }
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats();
  const stats = data as Record<string, number> | undefined;
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setHasChanges(false);
  };

  const tiles = [
    {
      label: "Total Courses",
      value: stats?.courses ?? 0,
      icon: BookOpen,
      href: "/admin/courses",
      gradient: "from-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/20",
    },
    {
      label: "Active Users",
      value: stats?.users ?? 0,
      icon: Users,
      href: "/admin/users",
      gradient: "from-emerald-500 to-teal-600",
      shadow: "shadow-emerald-500/20",
    },
    {
      label: "Total Revenue",
      value: stats?.subscriptions ?? 0,
      icon: CreditCard,
      href: "/admin/subscriptions",
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/20",
    },
    {
      label: "New Inquiries",
      value: stats?.inquiries ?? 0,
      icon: MessageSquare,
      href: "/admin/inquiries",
      gradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
    },
  ];

  return (
    <div className="space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-black tracking-tight text-slate-900"
          >
            Dashboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 mt-1 font-bold"
          >
            Welcome back, <span className="text-blue-600">Admin</span>. Everything is running smoothly.
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ProgressIndicator />
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
              <Card className="relative p-7 bg-white/60 backdrop-blur-xl border-white shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-500 overflow-hidden rounded-3xl">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="size-4 text-slate-300" />
                </div>
                <div className="flex flex-col gap-6">
                  <div className={`flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.gradient} ${tile.shadow} text-white transition-transform group-hover:scale-110 duration-500 ring-8 ring-white/50`}>
                    <tile.icon className="size-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{tile.label}</p>
                    <p className="text-4xl font-black text-slate-900 mt-1">
                      {isLoading ? (
                        <span className="inline-block w-16 h-10 bg-slate-100 rounded-xl animate-pulse" />
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full p-10 bg-white/60 backdrop-blur-xl border-white shadow-sm rounded-3xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Actions</h3>
                <p className="text-sm text-slate-400 font-bold mt-1">Optimize your workflow with 1-click tools</p>
              </div>
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 ring-4 ring-blue-50/50">
                <Zap className="size-5 fill-blue-600" />
              </div>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { title: "New Course", desc: "Build a new learning journey", href: "/admin/courses/new", icon: BookOpen, color: "blue", action: () => setHasChanges(true) },
                { title: "Support Inbox", desc: "Respond to student inquiries", href: "/admin/inquiries", icon: MessageSquare, color: "emerald" },
                { title: "Analytics", desc: "Deep dive into performance", href: "/admin/reports", icon: TrendingUp, color: "violet" },
                { title: "Configuration", desc: "Manage platform behavior", href: "/admin/settings", icon: Settings, color: "slate" },
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => action.action?.()}
                  className="group flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/50 p-6 text-sm text-left hover:bg-white hover:shadow-2xl hover:shadow-slate-100 transition-all duration-500"
                >
                  <div className={`size-12 rounded-2xl bg-${action.color}-50 flex items-center justify-center text-${action.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                    <action.icon className="size-6" />
                  </div>
                  <div>
                    <span className="block font-black text-slate-900 text-base">{action.title}</span>
                    <span className="text-slate-400 font-bold text-xs mt-0.5 block">{action.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full p-10 bg-white/60 backdrop-blur-xl border-white shadow-sm rounded-3xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Activity</h3>
                <p className="text-sm text-slate-400 font-bold mt-1">Real-time platform events</p>
              </div>
              <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Clock className="size-5" />
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="size-10 text-slate-200" />
                </motion.div>
              </div>
              <p className="text-base font-black text-slate-900">System is idle</p>
              <p className="text-xs text-slate-400 font-bold mt-2 max-w-[200px] leading-relaxed">
                Everything looks perfect. We'll notify you when something needs attention.
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
        You have unsaved changes in your dashboard.
      </UnsavePopup>
    </div>
  );
}

// Helper icons
function Settings(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
