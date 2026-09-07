"use client";

import { use, useState, useEffect } from "react";

interface AdminLesson {
  id: string;
  title: string;
  status: string;
  duration?: number;
}

interface AdminCourse {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  currentPrice?: number;
  originalPrice?: number;
  createdAt?: string;
  slug?: string;
  status?: string;
}
import Link from "next/link";
import { useAdminCourse, useUpdateCourse, useUpdateCourseStatus } from "@/hooks/admin/use-admin-courses";
import { useAdminLessons, useCreateLesson, useReorderLessons, useToggleLessonVisibility } from "@/hooks/admin/use-admin-lessons";
import { statusLabel } from "@/lib/admin/admin-utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  BookOpen, 
  ExternalLink, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings2, 
  Layout, 
  DollarSign, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Edit3,
  UploadCloud,
  PlayCircle,
  Zap,
  Clock,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { UnsavePopup } from "@/components/ui/unsave-popup";
import { LessonEditor } from "./_components/lesson-editor";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

const TABS = [
  { id: "curriculum", label: "Curriculum", icon: BookOpen },
  { id: "basic", label: "General", icon: Layout },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "settings", label: "Management", icon: Settings2 },
];

export default function AdminCourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data: course, isLoading: isCourseLoading } = useAdminCourse(courseId);
  const { data: lessonsData, isLoading: isLessonsLoading } = useAdminLessons(courseId);
  const updateCourse = useUpdateCourse();
  const updateStatus = useUpdateCourseStatus();
  const reorderLessons = useReorderLessons();
  
  const [activeTab, setActiveTab] = useState("curriculum");
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<AdminLesson | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingData, setPendingData] = useState<Partial<AdminCourse> | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (lessonsData) {
      setTimeout(() => {
        setLessons(lessonsData as AdminLesson[]);
      }, 0);
    }
  }, [lessonsData]);

  const c = course as AdminCourse | undefined;

  const handleReorder = async (newLessons: AdminLesson[]) => {
    const previous = lessons;
    setLessons(newLessons);
    try {
      await reorderLessons.mutateAsync({ 
        courseId, 
        data: { lessonIds: newLessons.map(l => l.id) } 
      });
    } catch {
      setLessons(previous);
      toast.error("Failed to reorder modules");
    }
  };

  const onTabChange = (id: string) => {
    if (hasChanges) {
      toast.info("Save your protocol modifications before state switching");
      return;
    }

    // Auto-fix missing slug if needed
    if (c && !c.slug) {
        const generatedSlug = String(c.title ?? "")
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
        
        if (generatedSlug) {
            setPendingData({ ...pendingData, slug: generatedSlug });
            setHasChanges(true);
            toast.warning("Registry detected missing URL slug. Protocol auto-generated. Please save to synchronize.");
            return;
        }
    }

    setActiveTab(id);
  };

  const handleSaveAll = async () => {
    if (!pendingData) {
        setHasChanges(false);
        return;
    }
    try {
      await updateCourse.mutateAsync({ id: courseId, data: pendingData });
      toast.success("Curriculum node synchronized with registry core");
      setHasChanges(false);
      setPendingData(null);
    } catch {
      toast.error("Registry synchronization failure");
    }
  };

  if (isCourseLoading) {
    return (
      <div className="space-y-12">
        <div className="flex justify-between items-end px-2">
          <div className="space-y-3">
            <Skeleton className="h-5 w-40 rounded-full" />
            <Skeleton className="h-12 w-96 rounded-2xl" />
          </div>
          <Skeleton className="h-16 w-64 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-8">
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-[600px] w-full rounded-[40px]" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-80 w-full rounded-[40px]" />
            <Skeleton className="h-64 w-full rounded-[40px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <div className="size-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 ring-1 ring-slate-100 shadow-inner">
          <AlertCircle className="size-12 text-slate-200" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">Curriculum Node Offline</h2>
        <p className="text-[13px] text-slate-400 mt-3 font-bold uppercase tracking-widest max-w-[320px] opacity-70 leading-relaxed max-w-[320px]">
          The requested architectural node has been decommissioned or moved within the registry.
        </p>
        <Link href="/admin/courses">
          <Button variant="outline" className="mt-12 rounded-[22px] px-10 h-14 font-black uppercase tracking-[0.2em] text-[11px] border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
            <ArrowLeft className="size-4 mr-3 stroke-[3]" />
            Return to Registry
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-1.5">
          <Link
            href="/admin/courses"
            className="group w-fit px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/60 text-[9px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="size-2.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={4} />
            Registry Core
          </Link>
          <div className="flex items-center gap-5">
            <h1 className="text-4xl font-[900] tracking-[-0.04em] text-slate-900">
              {String(c.title ?? "Untitled Builder")}
            </h1>
            <Badge
              className={cn(
                "rounded-full px-5 py-1.5 font-[900] text-[10px] uppercase tracking-[0.1em] border shadow-sm",
                c.status === "active" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100/60 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.2)]" 
                  : "bg-slate-100 text-slate-500 border-slate-200/60"
              )}
            >
              {statusLabel(String(c.status ?? ""))}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-white/40 backdrop-blur-xl p-4 pl-8 rounded-[32px] border border-white shadow-xl shadow-slate-200/40">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Build Status</span>
            <span className="text-[13px] font-[900] text-slate-900 tracking-tight">{lessons.length} Modules Synced</span>
          </div>
          <ProgressIndicator step={1} hideButtons className="gap-0" />
        </div>
      </header>

      <div className="flex items-center gap-2 bg-slate-200/40 backdrop-blur-md p-1.5 rounded-[22px] w-fit border border-slate-200/20 shadow-inner overflow-x-auto max-w-full">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2.5 px-6 py-3 rounded-[18px] text-[13px] font-[900] tracking-tight transition-all duration-500 active:scale-95",
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60"
                : "text-slate-400 hover:text-slate-900 hover:bg-white/40"
            )}
          >
            <tab.icon className={cn("size-4 stroke-[2.5]", activeTab === tab.id ? "text-blue-600" : "text-slate-300")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {activeTab === "curriculum" && (
                <CurriculumTab 
                  courseId={courseId} 
                  lessons={lessons} 
                  onReorder={handleReorder}
                  isLoading={isLessonsLoading}
                    onEditLesson={(lesson: AdminLesson) => {
                    setSelectedLesson(lesson);
                    setIsEditorOpen(true);
                  }}
                />
              )}
              {activeTab === "basic" && (
                <BasicTab key={resetKey}
                  course={c} 
                  onChanges={(data: Record<string, unknown>) => {
                    setHasChanges(true);
                    setPendingData({ ...pendingData, ...data });
                  }} 
                />
              )}
              {activeTab === "pricing" && (
                <PricingTab key={resetKey}
                  course={c} 
                  onChanges={(data: Record<string, unknown>) => {
                    setHasChanges(true);
                    setPendingData({ ...pendingData, ...data });
                  }} 
                />
              )}
              {activeTab === "media" && <MediaTab />}
              {activeTab === "settings" && (
                <SettingsTab 
                  course={c} 
                  onStatusChange={(status: string) => updateStatus.mutate({ id: courseId, data: { status } })} 
                  isPending={updateStatus.isPending}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="space-y-8">
          <Card className="p-8 bg-white/70 backdrop-blur-3xl border border-white rounded-[40px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] flex flex-col gap-6">
            <h3 className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.3em] ml-2">Node Preview</h3>
            <div className="rounded-[32px] border border-slate-100 overflow-hidden bg-white shadow-[0_12px_24px_-8px_rgba(0,0,0,0.04)] group/card">
              <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center text-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(37,99,235,0.03),_transparent)]" />
                <ImageIcon className="size-16 opacity-10 group-hover/card:scale-110 transition-transform duration-1000" strokeWidth={1} />
              </div>
              <div className="p-6 space-y-4">
                <p className="text-lg font-[900] text-slate-900 tracking-tight leading-tight line-clamp-2">{String(c.title ?? "")}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <div className="px-2.5 py-0.5 rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {String(c.category ?? "") || "General"}
                  </div>
                  {c.currentPrice != null && (
                    <p className="text-lg font-[900] text-blue-600 tracking-tighter">${Number(c.currentPrice).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
            {c.slug != null && (
              <Link href={`/courses/${String(c.slug)}`} target="_blank">
                <Button variant="outline" className="w-full rounded-[20px] font-black uppercase tracking-[0.2em] text-[10px] h-14 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
                  <ExternalLink className="size-3.5 mr-3 stroke-[3]" />
                  Live Deployment
                </Button>
              </Link>
            )}
          </Card>

          <Card className="p-8 bg-slate-900 text-white rounded-[40px] shadow-2xl shadow-blue-900/10 flex flex-col gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000">
              <CheckCircle2 className="size-32" strokeWidth={1} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="size-10 rounded-[14px] bg-blue-500/20 flex items-center justify-center ring-1 ring-blue-400/30">
                <CheckCircle2 className="size-5 text-blue-400 stroke-[2.5]" />
              </div>
              <h3 className="text-[11px] font-[900] uppercase tracking-[0.3em] text-blue-400">Registry Info</h3>
            </div>
            <div className="space-y-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] relative z-10">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span>Unique ID</span>
                <span className="text-white font-[900] tracking-normal font-mono bg-white/5 px-2 py-1 rounded-md">{String(c.id ?? "").slice(0, 12)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span>Synchronized</span>
                <span className="text-white font-[900] tracking-tight">{c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span>Status</span>
                <span className={cn("font-[900] tracking-[0.1em]", c.status === "active" ? "text-emerald-400" : "text-amber-400")}>
                  {String(c.status ?? "").toUpperCase()}
                </span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <LessonEditor 
        lesson={selectedLesson} 
        isOpen={isEditorOpen} 
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedLesson(null);
        }} 
      />

      <UnsavePopup 
        show={hasChanges} 
        onSave={handleSaveAll} 
        onReset={() => {
          setHasChanges(false);
          setPendingData(null);
          setResetKey(k => k + 1);
        }}
      >
        <span className="font-bold tracking-tight">Registry Node Modification Protocol Active</span>
      </UnsavePopup>
    </div>
  );
}

function CurriculumTab({ courseId, lessons, onReorder, isLoading, onEditLesson }: {
  courseId: string;
  lessons: AdminLesson[];
  onReorder: (lessons: AdminLesson[]) => void;
  isLoading: boolean;
  onEditLesson: (lesson: AdminLesson) => void;
}) {
  const createLesson = useCreateLesson();
  const toggleVisibility = useToggleLessonVisibility();
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleReorderWithHighlight = (newLessons: AdminLesson[]) => {
    onReorder(newLessons);
    setMovingId(null);
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return;
    try {
      await createLesson.mutateAsync({ 
        courseId, 
        data: { title: newLessonTitle, status: "draft" } 
      });
      setNewLessonTitle("");
      toast.success("Lesson node initialized");
    } catch {
      toast.error("Initialization protocol failure");
    }
  };

  if (isLoading) return <Skeleton className="h-[600px] w-full rounded-[40px]" />;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between px-2 mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">Curriculum Architect</h2>
          <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Sequence & Orchestrate Lessons</p>
        </div>
        
        <Dialog>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-[18px] px-6 h-12 font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_4px_12px_-2px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 active:scale-95 border-b-4 border-blue-800">
                    <Plus className="size-3.5 stroke-[4]" />
                    Add Lesson
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[32px] border-slate-200 bg-white p-8">
                <DialogHeader className="space-y-1 text-left">
                    <DialogTitle className="text-xl font-[900] text-slate-900 tracking-tight">Initialize Module</DialogTitle>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Add new lesson node to registry</p>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                    <Input 
                        placeholder="Lesson Title (e.g. Architecture Deep Dive)..." 
                        className="rounded-2xl border-slate-200 h-14 font-bold text-sm bg-slate-50 focus:bg-white transition-all"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                    />
                    <Button 
                        className="w-full bg-slate-900 hover:bg-black text-white rounded-2xl font-[900] h-14 uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-slate-200 transition-all active:scale-95"
                        onClick={handleAddLesson}
                        disabled={createLesson.isPending}
                    >
                        {createLesson.isPending ? "Synchronizing..." : "Confirm Protocol"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white/70 backdrop-blur-3xl border border-white rounded-[40px] overflow-hidden shadow-[0_8px_30px_-4px_rgba(0,0,0,0.02)]">
        <div className="p-6 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between px-10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Execution Sequence</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{lessons.length} Lessons</span>
        </div>
        
        <Reorder.Group 
          axis="y" 
          values={lessons} 
          onReorder={handleReorderWithHighlight}
          className="divide-y divide-slate-100/60"
        >
          {lessons.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center px-10">
              <div className="size-20 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 ring-1 ring-slate-100 shadow-inner">
                <BookOpen className="size-10 text-slate-200" strokeWidth={1.5} />
              </div>
              <p className="text-xl font-[900] text-slate-900 tracking-tight">Curriculum Void</p>
              <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mt-3 opacity-70 leading-relaxed max-w-[280px]">
                No lessons found in this node. Initialize your first lesson to begin sequence.
              </p>
            </div>
          ) : (
            lessons.map((lesson: AdminLesson, index: number) => (
              <Reorder.Item 
                key={lesson.id} 
                value={lesson}
                layout
                whileDrag={{ 
                  scale: 1.03, 
                  boxShadow: "0 20px 60px -8px rgba(59,130,246,0.25)",
                  borderRadius: "24px",
                  zIndex: 50,
                  transition: { duration: 0.2 }
                }}
                className={cn(
                  "group cursor-default transition-all duration-500",
                  movingId === lesson.id
                    ? "bg-blue-50 shadow-[0_0_24px_-4px_rgba(59,130,246,0.25)] scale-[1.01]"
                    : "bg-white/40 hover:bg-white"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 py-6 px-5 sm:px-10">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-blue-400 transition-colors duration-300 p-2 -ml-2 rounded-xl hover:bg-blue-50 shrink-0">
                      <GripVertical className="size-4.5 stroke-[2.5]" />
                    </div>
                    <div className="size-9 sm:size-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[10px] sm:text-[11px] font-[900] text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-500 shadow-inner shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex sm:hidden gap-2">
                       <button 
                        onClick={() => toggleVisibility.mutate(lesson.id)}
                        className="size-9 rounded-xl bg-slate-100/50 flex items-center justify-center text-slate-400"
                       >
                        {lesson.status === "active" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                       </button>
                       <button 
                        onClick={() => onEditLesson(lesson)}
                        className="size-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20"
                       >
                        <Edit3 className="size-4" />
                       </button>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-[900] text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors duration-300">{lesson.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        "text-[9px] font-[900] uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border",
                        lesson.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-400 border-slate-200"
                      )}>
                        {lesson.status === "active" ? "Synchronized" : "Staging"}
                      </span>
                      {lesson.duration && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          <PlayCircle className="size-3" />
                          {lesson.duration}m Protocol
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-3">
                    <button 
                      onClick={() => toggleVisibility.mutate(lesson.id)}
                      className="size-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all active:scale-90 border border-transparent hover:border-slate-200"
                      title={lesson.status === "active" ? "Deactivate Signal" : "Synchronize Signal"}
                    >
                      {lesson.status === "active" ? <Eye className="size-4.5 stroke-[2.5]" /> : <EyeOff className="size-4.5 stroke-[2.5]" />}
                    </button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditLesson(lesson)}
                      className="h-10 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 border border-transparent shadow-sm hover:shadow-md transition-all px-5"
                    >
                      <Edit3 className="size-3.5 mr-2 stroke-[3]" />
                      Configure Node
                    </Button>
                  </div>
                </div>
              </Reorder.Item>
            ))
          )}
        </Reorder.Group>
      </Card>
    </div>
  );
}

function BasicTab({ course, onChanges }: { course: AdminCourse; onChanges: (data: Record<string, unknown>) => void }) {
  const [title, setTitle] = useState(String(course.title ?? ""));
  const [description, setDescription] = useState(String(course.description ?? ""));
  const [category, setCategory] = useState(String(course.category ?? ""));

  const handleChange = (field: string, value: string) => {
    if (field === "title") setTitle(value);
    if (field === "description") setDescription(value);
    if (field === "category") setCategory(value);
    onChanges({ [field]: value });
  };

  return (
    <Card className="p-12 bg-white/70 backdrop-blur-3xl border border-white rounded-[40px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-12">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">Core Node Identity</h2>
        <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Primary curriculum variables</p>
      </div>
      
      <div className="grid gap-10">
        <div className="space-y-3.5">
          <label className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em] ml-1">Entity Title</label>
          <Input 
            value={title} 
            onChange={(e) => handleChange("title", e.target.value)} 
            className="h-16 rounded-[22px] border-slate-200/80 bg-white/40 focus:bg-white focus:ring-[12px] focus:ring-blue-500/5 font-[900] text-xl tracking-tight transition-all px-8 shadow-sm"
          />
        </div>
        <div className="space-y-3.5">
          <label className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em] ml-1">Architectural Abstract</label>
          <Textarea
            value={description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={6}
            className="rounded-[32px] border-slate-200/80 bg-white/40 focus:bg-white focus:ring-[12px] focus:ring-blue-500/5 font-bold text-base leading-relaxed resize-none transition-all p-8 shadow-sm"
          />
        </div>
        <div className="space-y-3.5">
          <label className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em] ml-1">System Sector</label>
          <Input 
            value={category} 
            onChange={(e) => handleChange("category", e.target.value)} 
            className="h-14 rounded-[20px] border-slate-200 bg-white focus:ring-[10px] focus:ring-blue-500/5 font-black text-sm transition-all px-6"
          />
        </div>
      </div>
    </Card>
  );
}

function PricingTab({ course, onChanges }: { course: AdminCourse; onChanges: (data: Record<string, unknown>) => void }) {
  const [price, setPrice] = useState(course.currentPrice != null ? String(course.currentPrice / 100) : "");
  const [discountPrice, setDiscountPrice] = useState(course.originalPrice != null ? String(course.originalPrice / 100) : "");

  const handleChange = (field: string, value: string) => {
    if (field === "currentPrice") setPrice(value);
    if (field === "originalPrice") setDiscountPrice(value);
    onChanges({ [field]: value ? Math.round(Number(value) * 100) : undefined });
  };

  return (
    <Card className="p-12 bg-white/70 backdrop-blur-3xl border border-white rounded-[40px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-12">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">Financial Protocol</h2>
        <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Economic valuation & incentives</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-10">
        <div className="space-y-3.5">
          <label className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em] ml-1">Current Valuation ($)</label>
          <div className="relative group">
            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-600 transition-colors stroke-[3]" />
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => handleChange("currentPrice", e.target.value)}
              className="h-20 pl-14 rounded-[28px] border-slate-200/80 bg-white focus:bg-white focus:ring-[15px] focus:ring-blue-500/5 font-[900] text-3xl tracking-tighter transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="space-y-3.5">
          <label className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em] ml-1">Baseline Value ($)</label>
          <div className="relative group">
            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-600 transition-colors stroke-[3]" />
            <Input
              type="number"
              step="0.01"
              value={discountPrice}
              onChange={(e) => handleChange("originalPrice", e.target.value)}
              className="h-20 pl-14 rounded-[28px] border-slate-200/80 bg-slate-50 focus:bg-white focus:ring-[15px] focus:ring-slate-500/5 font-[900] text-3xl tracking-tighter text-slate-400 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-600/5 p-8 rounded-[32px] border border-blue-100/50 flex items-start gap-5">
        <div className="size-10 rounded-[14px] bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
          <Zap className="size-5 fill-white" />
        </div>
        <p className="text-[13px] font-bold text-blue-700 leading-relaxed uppercase tracking-wide opacity-90">
          Optimization Node: Strategic promotional values increase conversion frequency by ~30%. Protocol recommends maintaining a significant delta between baseline and current valuations.
        </p>
      </div>
    </Card>
  );
}

function MediaTab() {
  return (
    <Card className="p-12 bg-white/70 backdrop-blur-3xl border border-white rounded-[40px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-12">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-[900] text-slate-900 tracking-tight">Visual Interface</h2>
        <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Media assets & brand signals</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <label className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em] ml-1 block">Cover Artifact</label>
          <div className="aspect-[16/10] rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center p-8 transition-all hover:bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer group shadow-inner">
            <div className="size-16 rounded-[20px] bg-white shadow-md flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 ring-1 ring-slate-100">
              <UploadCloud className="size-8 text-slate-400 group-hover:text-blue-600 transition-colors stroke-[2]" />
            </div>
            <p className="text-base font-[900] text-slate-900 tracking-tight">Upload Asset</p>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-[0.1em] opacity-80">UHD standard (3840x2160)</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-[900] text-slate-400 uppercase tracking-[0.25em] ml-1 block">Video Stream Probe</label>
          <div className="aspect-[16/10] rounded-[32px] bg-slate-900 flex flex-col items-center justify-center text-center p-8 shadow-2xl relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-[2000ms] ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500 ring-1 ring-white/20">
                <PlayCircle className="size-10 text-white stroke-[1.5]" />
              </div>
              <p className="text-base font-[900] text-white tracking-tight">Configure Trailer</p>
              <p className="text-[10px] text-white/40 font-black uppercase mt-2 tracking-[0.1em]">Encrypted stream required</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  slate: "border-slate-500 shadow-2xl shadow-slate-500/20 ring-8 ring-slate-500/5",
  emerald: "border-emerald-500 shadow-2xl shadow-emerald-500/20 ring-8 ring-emerald-500/5",
  amber: "border-amber-500 shadow-2xl shadow-amber-500/20 ring-8 ring-amber-500/5",
  rose: "border-rose-500 shadow-2xl shadow-rose-500/20 ring-8 ring-rose-500/5",
};
const STATUS_BG: Record<string, string> = {
  slate: "bg-slate-500 shadow-slate-500/30",
  emerald: "bg-emerald-500 shadow-emerald-500/30",
  amber: "bg-amber-500 shadow-amber-500/30",
  rose: "bg-rose-500 shadow-rose-500/30",
};
const STATUS_BG_SOLID: Record<string, string> = {
  slate: "bg-slate-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};
const STATUS_BADGE: Record<string, string> = {
  slate: "bg-slate-500/10 text-slate-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  rose: "bg-rose-500/10 text-rose-500",
};

function SettingsTab({ course, onStatusChange, isPending }: { course: AdminCourse; onStatusChange: (status: string) => void; isPending: boolean }) {
  return (
    <Card className="p-12 bg-white/70 backdrop-blur-3xl border border-white rounded-[40px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] space-y-12 relative overflow-hidden">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isPending && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6 max-w-sm"
            >
              <div className="relative">
                <div className="size-20 rounded-[28px] bg-blue-500/10 flex items-center justify-center mx-auto">
                  <div className="size-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 size-8 rounded-full bg-white dark:bg-zinc-900 shadow-lg flex items-center justify-center"
                >
                  <Zap className="size-4 text-blue-500 fill-blue-500" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter">Synchronizing State</h3>
                <p className="text-[11px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Registry Communication Protocol Active</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-[1000] text-slate-900 tracking-tight">Registry Management</h2>
        <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Lifecycle control & access protocols</p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Operational Course State</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { 
              id: "draft", 
              label: "Staging", 
              intel: "Incubation",
              desc: "Course is in development. Hidden from search and students.",
              icon: Clock,
              color: "slate"
            },
            { 
              id: "active", 
              label: "Synchronized", 
              intel: "Production",
              desc: "Live and operational. Enrolled students have full access.",
              icon: CheckCircle2,
              color: "emerald"
            },
            { 
              id: "inactive", 
              label: "Deactivated", 
              intel: "Maintenance",
              desc: "Temporarily offline. New enrollments are paused.",
              icon: EyeOff,
              color: "amber"
            },
            { 
              id: "archived", 
              label: "Terminated", 
              intel: "Legacy",
              desc: "Retired from registry. Completion data is preserved.",
              icon: AlertCircle,
              color: "rose"
            },
          ].map((s) => (
            <motion.button
              key={s.id}
              disabled={isPending}
              whileHover={isPending ? {} : { scale: 1.02, y: -4 }}
              whileTap={isPending ? {} : { scale: 0.98 }}
              onClick={() => onStatusChange(s.id)}
              className={cn(
                "relative flex flex-col text-left p-8 rounded-[36px] transition-all duration-500 border-2 overflow-hidden group",
                isPending ? "cursor-wait opacity-50" : "cursor-pointer",
                course.status === s.id 
                  ? `bg-white dark:bg-zinc-900 ${STATUS_COLORS[s.color] ?? STATUS_COLORS.slate}` 
                  : "bg-slate-50/50 dark:bg-zinc-950/50 border-transparent hover:border-slate-200 dark:hover:border-zinc-800"
              )}
            >
              <div className="flex items-start justify-between mb-6">
                <div className={cn(
                  "p-4 rounded-[22px] text-white shadow-lg transition-colors duration-500",
                  course.status === s.id ? (STATUS_BG[s.color] ?? STATUS_BG.slate) : "bg-slate-200 dark:bg-zinc-800"
                )}>
                  <s.icon className="size-6 stroke-[2.5]" />
                </div>
                {course.status === s.id && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="size-8 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100"
                  >
                    <div className={cn("size-3 rounded-full animate-pulse", STATUS_BG_SOLID[s.color] ?? STATUS_BG_SOLID.slate)} />
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-3">
                  <h3 className={cn(
                    "text-base font-[1000] uppercase tracking-wider transition-colors duration-500",
                    course.status === s.id ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-zinc-500"
                  )}>
                    {s.label}
                  </h3>
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-full transition-all duration-500",
                    course.status === s.id 
                      ? (STATUS_BADGE[s.color] ?? STATUS_BADGE.slate) 
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                  )}>
                    {s.intel}
                  </span>
                </div>
                <p className={cn(
                  "text-[12px] font-bold leading-relaxed transition-colors duration-500",
                  course.status === s.id ? "text-slate-500 dark:text-zinc-400" : "text-slate-400/60 dark:text-zinc-600"
                )}>
                  {s.desc}
                </p>
              </div>

              {/* Animated Glow Halo */}
              <AnimatePresence>
                {course.status === s.id && (
                  <motion.div 
                    layoutId="course-haloglow"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "absolute -right-8 -bottom-8 size-48 blur-3xl rounded-full opacity-20 pointer-events-none transition-colors duration-700",
                      STATUS_BG_SOLID[s.color] ?? STATUS_BG_SOLID.slate
                    )}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Course Intelligence Dashboard */}
        <motion.div 
          layout
          className="bg-slate-900 text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.05),_transparent)]" />
          
          <div className="flex items-start gap-8 relative z-10">
            <div className="p-5 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-700">
              <Zap className="size-8 text-blue-400 fill-blue-400/20" />
            </div>
            <div className="space-y-5 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-[1000] text-blue-400 uppercase tracking-[0.5em]">Course Intelligence Dashboard</h4>
                <div className="px-4 py-1 rounded-full bg-white/5 text-[9px] font-black text-white/40 uppercase tracking-widest border border-white/5">
                  Global Deployment Logic
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={course.status}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-3xl font-[1000] uppercase tracking-tighter",
                      course.status === "draft" && "text-slate-400",
                      course.status === "active" && "text-emerald-400",
                      course.status === "inactive" && "text-amber-400",
                      course.status === "archived" && "text-rose-400"
                    )}>
                      {course.status}
                    </span>
                    <ArrowRight className="size-6 text-white/10" />
                    <span className="text-[14px] font-black text-white/90 uppercase tracking-[0.2em]">
                      {course.status === "draft" && "Staged Incubation"}
                      {course.status === "active" && "Production Live Execution"}
                      {course.status === "inactive" && "Maintenance Pause Protocol"}
                      {course.status === "archived" && "Terminal Historical Record"}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-3xl">
                    {course.status === "draft" && "The course is isolated in a development environment. All lesson nodes are private by default. This state is recommended for initial curricular architecture and visual artifact configuration."}
                    {course.status === "active" && "The course is fully operational in the public registry. Enrollment signals are active, and payment gateways are engaged. All 'Live' lessons are immediately accessible to authenticated students."}
                    {course.status === "inactive" && "Operational pause. The course remains visible in student libraries but new enrollments are restricted. Existing students retain access, but the course is removed from public discovery registries."}
                    {course.status === "archived" && "Terminal state. The course is decommissioned. No new enrollments are possible, and it is hidden from all public views. Completion records and financial logs are preserved for historical auditing."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-rose-600/5 p-8 rounded-[32px] border border-rose-100/50 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
            <AlertCircle className="size-4 stroke-[3]" />
          </div>
          <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.3em]">Critical Protocol</h4>
        </div>
        <p className="text-[13px] font-bold text-rose-500 leading-relaxed uppercase tracking-wide opacity-90 pl-11">
          Decommissioning a curriculum node will terminate all active enrollment signals and remove identity from public registries. This action is reversible but requires supervisor override.
        </p>
      </div>
    </Card>
  );
}
