"use client";

import { useAdminStats } from "@/hooks/admin/use-admin-stats";
import { Card } from "@/components/ui/card";
import { BookOpen, Users, CreditCard, MessageSquare, ArrowRight, Zap, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminStats();
  const stats = data as Record<string, number> | undefined;

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
    <div className="space-y-10">
      <header>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-bold tracking-tight text-slate-900"
        >
          Dashboard
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-500 mt-2 font-medium"
        >
          Welcome back. Here's what's happening on ScholarX today.
        </motion.p>
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
              <Card className="relative p-6 bg-white/60 backdrop-blur-lg border-white/40 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="size-4 text-slate-300" />
                </div>
                <div className="flex flex-col gap-4">
                  <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${tile.gradient} ${tile.shadow} text-white transition-transform group-hover:scale-110 duration-300 ring-4 ring-white`}>
                    <tile.icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{tile.label}</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">
                      {isLoading ? (
                        <span className="inline-block w-12 h-8 bg-slate-100 rounded-lg animate-pulse" />
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
          <Card className="h-full p-8 bg-white/60 backdrop-blur-lg border-white/40 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
                <p className="text-sm text-slate-400 font-medium">Efficiency is just a click away</p>
              </div>
              <Zap className="size-5 text-blue-500 fill-blue-500/10" />
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "New Course", desc: "Build a new learning journey", href: "/admin/courses/new", icon: BookOpen, color: "blue" },
                { title: "Pending Inquiries", desc: "Respond to student questions", href: "/admin/inquiries", icon: MessageSquare, color: "emerald" },
                { title: "Revenue Reports", desc: "Analyze financial performance", href: "/admin/reports", icon: TrendingUp, color: "violet" },
                { title: "System Settings", desc: "Configure platform behavior", href: "/admin/settings", icon: Settings, color: "slate" },
              ].map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/50 p-5 text-sm hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
                >
                  <div className={`size-10 rounded-xl bg-${action.color}-50 flex items-center justify-center text-${action.color}-600 group-hover:scale-110 transition-transform`}>
                    <action.icon className="size-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-slate-900">{action.title}</span>
                    <span className="text-slate-400 font-medium text-xs">{action.desc}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full p-8 bg-white/60 backdrop-blur-lg border-white/40 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                <p className="text-sm text-slate-400 font-medium">What's happening now</p>
              </div>
              <Clock className="size-5 text-slate-400" />
            </div>
            
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Zap className="size-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-900">Activity feed is warming up</p>
              <p className="text-xs text-slate-400 font-medium mt-1 max-w-[200px]">
                Real-time updates will appear here as the platform scales.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
