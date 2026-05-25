"use client";

import { useState, useEffect } from "react";

interface LessonData {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  isPrivate?: boolean;
  status?: string;
  updatedAt?: string;
}
import { useUpdateLesson } from "@/hooks/admin/use-admin-lessons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer-sheet";
import { Label } from "@/components/ui/label";
import { 
  Video, 
  FileText, 
  Clock, 
  Lock, 
  Globe, 
  Sparkles,
  Layers,
  CheckCircle2,
  X,
  Zap,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface LessonEditorProps {
  lesson: LessonData | null;
  isOpen: boolean;
  onClose: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
} as const;

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20
    }
  }
} as const;

export function LessonEditor({ lesson, isOpen, onClose }: LessonEditorProps) {
  const updateLesson = useUpdateLesson();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    videoUrl: "",
    duration: 0,
    isPrivate: true,
    status: "draft"
  });

  useEffect(() => {
    if (lesson) {
      // Defer setting state to avoid synchronous effect warnings if needed, but here it's fine
      // when loading initial data. Eslint warns because it might cause cascading renders.
      // We wrap it in a setTimeout or just disable the warning as this is an initialization step.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        duration: lesson.duration || 1,
        isPrivate: lesson.isPrivate ?? true,
        status: lesson.status ?? "draft"
      });
    }
  }, [lesson]);

  const handleSave = async () => {
    if (!lesson) return;
    try {
      await updateLesson.mutateAsync({
        id: lesson.id,
        data: {
          ...formData,
          expectedVersion: lesson.updatedAt || new Date().toISOString()
        },
      });
      toast.success("Lesson configuration synchronized", {
        icon: <CheckCircle2 className="size-4 text-emerald-500" />,
        className: "rounded-[20px] bg-white/80 backdrop-blur-xl border-emerald-100 shadow-xl",
      });
      onClose();
    } catch (error: unknown) {
      console.error("Sync Error:", error);
      const msg = error && typeof error === "object" && "response" in error &&
                  typeof (error as Record<string, unknown>).response === "object" &&
                  (error as Record<string, unknown>).response !== null &&
                  "data" in ((error as Record<string, unknown>).response as Record<string, unknown>) &&
                  typeof (((error as Record<string, unknown>).response as Record<string, unknown>).data as Record<string, unknown>)?.message === "string"
                  ? (((error as Record<string, unknown>).response as Record<string, unknown>).data as Record<string, unknown>).message as string : "Check log";
      toast.error("Synchronization failure: " + msg);
    }
  };

  if (!lesson) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="sm:max-w-4xl mx-auto border-t-0 shadow-[0_-20px_60px_-12px_rgba(0,0,0,0.2)] bg-[#FBFBFD]/95 dark:bg-zinc-950/98 backdrop-blur-3xl rounded-t-[48px] overflow-hidden">
        {/* Immersive Loading Overlay */}
        <AnimatePresence>
          {updateLesson.isPending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center"
            >
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-8 max-w-md w-full"
              >
                <div className="relative">
                  <div className="size-24 rounded-[32px] bg-blue-500/10 flex items-center justify-center mx-auto ring-1 ring-blue-500/20">
                    <Layers className="size-10 text-blue-500 animate-pulse" />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-blue-500 rounded-[32px] opacity-40"
                  />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter">Synchronizing Architecture</h3>
                  <p className="text-[12px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Curriculum Node v{lesson.updatedAt?.slice(0, 4) || "2.0"} Propagation</p>
                </div>
                <div className="space-y-4">
                  <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest px-1">
                    <span>Transmitting Data</span>
                    <span>Registry Sync in Progress</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn("mx-auto w-full max-w-3xl overflow-y-auto max-h-[88vh] px-8 pb-12 pt-6 hide-scrollbar relative", updateLesson.isPending && "pointer-events-none")}>
          
          {/* Close Button - Magnetic Effect */}
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute right-4 top-4 p-2.5 rounded-full bg-slate-100/50 dark:bg-zinc-800/50 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-20 backdrop-blur-md border border-white/20 dark:border-white/5"
          >
            <X className="size-5" />
          </motion.button>

          {/* Header - Staggered & Animated */}
          <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center text-center mb-14 mt-4"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className="size-14 rounded-[20px] bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-400 flex items-center justify-center text-white mb-5 shadow-[0_10px_30px_-5px_rgba(37,99,235,0.4)] ring-4 ring-blue-500/10"
            >
              <Zap className="size-7 fill-white/20" />
            </motion.div>
            <motion.h2 className="text-2xl sm:text-3xl font-[1000] text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
              Lesson Architect
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">Pro</span>
            </motion.h2>
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-8 bg-slate-200 dark:bg-zinc-800" />
              <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
                Registry: <span className="text-blue-500">{lesson.id.slice(0, 12)}</span>
              </p>
              <span className="h-[1px] w-8 bg-slate-200 dark:bg-zinc-800" />
            </div>
          </motion.header>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Essential Configuration Section */}
            <motion.section 
              variants={itemVariants}
              className="group relative bg-white dark:bg-zinc-900/50 rounded-[32px] p-7 shadow-sm border border-slate-100 dark:border-white/5 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
              
              <div className="relative space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1 ml-1">
                    <Label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Identity Title</Label>
                    <span className="text-[9px] font-black text-blue-500/40 uppercase tracking-widest">Required Field</span>
                  </div>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="E.g., Quantum Computing Fundamentals"
                    className="h-12 rounded-2xl border-slate-200/50 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/30 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 font-bold text-base tracking-tight transition-all px-5 border-none shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em] ml-1">Abstract Concept</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the learning trajectory for this node..."
                    rows={2}
                    className="rounded-2xl border-none bg-slate-50/50 dark:bg-zinc-950/30 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 font-medium text-[13px] leading-relaxed transition-all p-5 resize-none shadow-inner"
                  />
                </div>
              </div>
            </motion.section>

            {/* Knowledge Registry (Markdown) */}
            <motion.section 
              variants={itemVariants}
              className="group relative bg-white dark:bg-zinc-900/50 rounded-[32px] p-7 shadow-sm border border-slate-100 dark:border-white/5 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 hover:border-indigo-500/20"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-indigo-500 animate-pulse" />
                  <Label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Knowledge Base</Label>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.15em] border border-slate-200 dark:border-zinc-700">
                  <FileText className="size-3 opacity-50" />
                  MD Engine v2
                </div>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                placeholder="# Start Architecting..."
                className="rounded-2xl border-none bg-slate-900/[0.03] dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 font-mono text-[13px] leading-relaxed p-6 transition-all shadow-inner scrollbar-hide"
              />
            </motion.section>

            {/* Bento Dynamic Grid */}
            <motion.section 
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {/* Video URL */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="sm:col-span-2 lg:col-span-2 bg-white dark:bg-zinc-900/50 rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/5 space-y-4 hover:border-red-500/20 group"
              >
                <div className="flex items-center gap-2 px-1">
                  <Video className="size-3.5 text-red-500 group-hover:scale-110 transition-transform" />
                  <Label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Visual Stream</Label>
                </div>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://cloud.scholarx.io/..."
                  className="h-10 rounded-xl border-none bg-slate-100/50 dark:bg-zinc-950/50 focus:bg-white dark:focus:bg-zinc-900 focus:ring-0 font-bold text-[12px] transition-all px-4 shadow-inner"
                />
              </motion.div>

              {/* Duration */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-zinc-900/50 rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/5 space-y-4 hover:border-emerald-500/20 group"
              >
                <div className="flex items-center gap-2 px-1">
                  <Clock className="size-3.5 text-emerald-500 group-hover:rotate-12 transition-transform" />
                  <Label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Temporal</Label>
                </div>
                <div className="flex items-center justify-between bg-slate-100/50 dark:bg-zinc-950/50 rounded-xl px-4 py-2 shadow-inner">
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setFormData({ ...formData, duration: Number.isNaN(parsed) ? 1 : Math.max(1, parsed) });
                    }}
                    className="bg-transparent border-none focus:ring-0 font-black text-lg text-center w-12 text-emerald-600"
                  />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Min</span>
                </div>
              </motion.div>

            {/* Access Protocol - Dual Bento Selection */}
            <motion.section 
              variants={itemVariants}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 px-1">
                <div className="size-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <Label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.4em]">Privacy & Access Protocol</Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { 
                    id: "private", 
                    label: "Secure Node", 
                    intel: "Private Access",
                    desc: "Restricted to authorized enrolled students only. Requires active subscription.",
                    icon: Lock,
                    color: "amber",
                    isPrivate: true
                  },
                  { 
                    id: "public", 
                    label: "Open Node", 
                    intel: "Public Preview",
                    desc: "Visible to all visitors as a free preview sample. Marketing discovery enabled.",
                    icon: Globe,
                    color: "emerald",
                    isPrivate: false
                  }
                ].map((p) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData({ ...formData, isPrivate: p.isPrivate })}
                    className={cn(
                      "relative flex flex-col text-left p-6 rounded-[32px] transition-all duration-300 border-2 cursor-pointer overflow-hidden group",
                      formData.isPrivate === p.isPrivate 
                        ? `bg-white dark:bg-zinc-900 border-${p.color}-500 shadow-2xl shadow-${p.color}-500/10 ring-4 ring-${p.color}-500/5` 
                        : "bg-slate-50/50 dark:bg-zinc-950/50 border-transparent hover:border-slate-200 dark:hover:border-zinc-800"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn(
                        "p-3 rounded-2xl text-white shadow-lg transition-colors duration-500",
                        formData.isPrivate === p.isPrivate ? `bg-${p.color}-500 shadow-${p.color}-500/30` : "bg-slate-200 dark:bg-zinc-800 text-slate-400"
                      )}>
                        <p.icon className="size-5" />
                      </div>
                      {formData.isPrivate === p.isPrivate && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={cn("size-6 rounded-full flex items-center justify-center bg-white shadow-md border", `text-${p.color}-500`)}
                        >
                          <CheckCircle2 className="size-4" />
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="space-y-1 relative z-10">
                      <h3 className={cn(
                        "text-[13px] font-black uppercase tracking-wider",
                        formData.isPrivate === p.isPrivate ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-zinc-400"
                      )}>
                        {p.label}
                      </h3>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.div 
                layout
                className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 rounded-[28px] p-6 relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
                    <Zap className="size-4 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Protocol Intelligence</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {formData.isPrivate 
                        ? "This node is encrypted for premium subscribers. Access tokens are required for visual stream decryption and knowledge base retrieval." 
                        : "This node is marked for discovery. It will be used in marketing funnels and SEO indexing to demonstrate curriculum quality."}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.section>

            {/* Node State - Advanced Interactive Bento Grid */}
              <div className="md:col-span-3 space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <div className="size-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <Label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.4em]">Operational Lifecycle State</Label>
                  </div>
                  <AnimatePresence>
                    {updateLesson.isPending && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-2 text-[9px] font-black text-blue-500 uppercase tracking-widest"
                      >
                        <div className="size-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                        Syncing State
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { 
                      id: "draft", 
                      label: "Draft", 
                      intel: "Incubation",
                      desc: "Work-in-progress. Private & Inaccessible.",
                      icon: FileText,
                      color: "blue"
                    },
                    { 
                      id: "staging", 
                      label: "Staging", 
                      intel: "QA Review",
                      desc: "Content complete. Pending final verification.",
                      icon: Layers,
                      color: "indigo"
                    },
                    { 
                      id: "published", 
                      label: "Live", 
                      intel: "Production",
                      desc: "Operational. Accessible to all students.",
                      icon: Globe,
                      color: "emerald"
                    },
                    { 
                      id: "archived", 
                      label: "Archived", 
                      intel: "Legacy",
                      desc: "Retired. Preserves historical data logs.",
                      icon: Lock,
                      color: "rose"
                    }
                  ].map((s) => (
                    <motion.button
                      key={s.id}
                      layout
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setFormData({ ...formData, status: s.id })}
                      className={cn(
                        "relative flex flex-col text-left p-6 rounded-[32px] transition-all duration-500 border-2 cursor-pointer overflow-hidden group",
                        formData.status === s.id 
                          ? `bg-white dark:bg-zinc-900 border-${s.color}-500 shadow-2xl shadow-${s.color}-500/20 ring-4 ring-${s.color}-500/5` 
                          : "bg-slate-50/50 dark:bg-zinc-950/50 border-transparent hover:border-slate-200 dark:hover:border-zinc-800"
                      )}
                    >
                      <div className="flex items-start justify-between mb-5">
                        <motion.div 
                          layout
                          className={cn(
                            "p-3.5 rounded-2xl text-white shadow-lg transition-colors duration-500",
                            formData.status === s.id ? `bg-${s.color}-500 shadow-${s.color}-500/30` : "bg-slate-200 dark:bg-zinc-800 text-slate-400"
                          )}
                        >
                          <s.icon className="size-5" />
                        </motion.div>
                        {formData.status === s.id && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className={cn("size-6 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100", `text-${s.color}-500`)}
                          >
                            <CheckCircle2 className="size-4" />
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="space-y-2 relative z-10">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "text-[14px] font-[1000] uppercase tracking-wider transition-colors duration-500",
                            formData.status === s.id ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-zinc-500"
                          )}>
                            {s.label}
                          </h3>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full transition-all duration-500",
                            formData.status === s.id 
                              ? `bg-${s.color}-500/10 text-${s.color}-500` 
                              : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                          )}>
                            {s.intel}
                          </span>
                        </div>
                        <p className={cn(
                          "text-[11px] font-bold leading-relaxed transition-colors duration-500",
                          formData.status === s.id ? "text-slate-500 dark:text-zinc-400" : "text-slate-400/60 dark:text-zinc-600"
                        )}>
                          {s.desc}
                        </p>
                      </div>

                      {/* Dynamic Background Halo */}
                      <AnimatePresence>
                        {formData.status === s.id && (
                          <motion.div 
                            layoutId="haloglow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                              "absolute -right-4 -bottom-4 size-32 blur-3xl rounded-full opacity-20 pointer-events-none transition-colors duration-700",
                              `bg-${s.color}-500`
                            )}
                          />
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>

                {/* State Intelligence Dashboard */}
                <motion.div 
                  layout
                  className="bg-slate-900 dark:bg-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500" />
                  <div className="flex items-start gap-6">
                    <div className="p-4 rounded-[22px] bg-white/10 dark:bg-slate-900/5 backdrop-blur-md">
                      <Sparkles className="size-6 text-white dark:text-slate-900 animate-pulse" />
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">State Intelligence Dashboard</h4>
                        <div className="px-3 py-1 rounded-full bg-white/5 dark:bg-slate-900/5 text-[8px] font-black text-white/40 dark:text-slate-900/40 uppercase tracking-widest border border-white/5 dark:border-slate-900/5">
                          Architectural Impact: High
                        </div>
                      </div>
                      
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={formData.status}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-xl font-[1000] text-white dark:text-slate-900 uppercase tracking-tighter",
                              formData.status === "draft" && "text-blue-400",
                              formData.status === "staging" && "text-indigo-400",
                              formData.status === "published" && "text-emerald-400",
                              formData.status === "archived" && "text-rose-400"
                            )}>
                              {formData.status}
                            </span>
                            <ArrowRight className="size-4 text-white/20 dark:text-slate-900/20" />
                            <span className="text-[12px] font-black text-white/80 dark:text-slate-900/80 uppercase tracking-widest">
                              {formData.status === "draft" && "Incubation & Private Development"}
                              {formData.status === "staging" && "Staged for Quality Assurance"}
                              {formData.status === "published" && "Live Curricular Operationalization"}
                              {formData.status === "archived" && "Legacy Data Preservation"}
                            </span>
                          </div>
                          <p className="text-[12px] font-medium text-slate-400 dark:text-slate-500 leading-relaxed max-w-2xl">
                            {formData.status === "draft" && "The lesson is isolated in a sandboxed state. Database visibility is restricted to administrators only. Students will not see this node in the curriculum tree, ensuring safe content iteration."}
                            {formData.status === "staging" && "Content is marked as 'Ready for Review'. This state signifies that the lesson has passed initial drafting and is pending a final executive or pedagogical check before production release."}
                            {formData.status === "published" && "High-priority production state. The lesson is instantly propagated to all student curriculum interfaces. Access is governed by the selected Protocol (Private/Public)."}
                            {formData.status === "archived" && "Strategic retirement. The lesson is hidden from active student view but remains in the database to maintain completion records and analytical data integrity."}
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.section>
          </motion.div>

          {/* Action Footer - High Energy */}
          <motion.footer 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", damping: 15 }}
            className="flex items-center gap-4 mt-14"
          >
            <motion.div className="flex-[2]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleSave}
                disabled={updateLesson.isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 font-black uppercase tracking-[0.25em] text-[11px] shadow-[0_15px_35px_-10px_rgba(37,99,235,0.4)] group relative overflow-hidden transition-all border-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                <div className="flex items-center justify-center gap-2">
                  {updateLesson.isPending ? (
                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 group-hover:scale-110 transition-transform" />
                      Commit Changes
                    </>
                  )}
                </div>
              </Button>
            </motion.div>
            
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full rounded-2xl h-14 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-black uppercase tracking-[0.25em] text-[10px] text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all border-[1.5px]"
              >
                Dismiss
              </Button>
            </motion.div>
          </motion.footer>
        </div>
      </DrawerContent>
    </Drawer>
  );
}


