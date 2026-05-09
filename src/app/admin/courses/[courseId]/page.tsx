"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useAdminCourse, useUpdateCourse, useUpdateCourseStatus } from "@/hooks/admin/use-admin-courses";
import { useAdminLessons, useCreateLesson, useReorderLessons, useToggleLessonVisibility } from "@/hooks/admin/use-admin-lessons";
import { formatDate, statusLabel } from "@/lib/admin/admin-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  BookOpen, 
  ExternalLink, 
  Save, 
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
  PlayCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { MorphingPopover, MorphingPopoverTrigger, MorphingPopoverContent } from "@/components/ui/morphing-popover";
import { UnsavePopup } from "@/components/ui/unsave-popup";
import { LessonEditor } from "./_components/lesson-editor";

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
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingData, setPendingData] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (lessonsData) {
      setLessons(lessonsData as any[]);
    }
  }, [lessonsData]);

  const c = course as Record<string, unknown> | undefined;

  const handleReorder = (newLessons: any[]) => {
    setLessons(newLessons);
    reorderLessons.mutate({ 
      courseId, 
      data: { lessonIds: newLessons.map(l => l.id) } 
    });
  };

  const onTabChange = (id: string) => {
    if (hasChanges) {
      toast.info("Save your changes before switching tabs");
      return;
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
      toast.success("Curriculum synchronized with core");
      setHasChanges(false);
      setPendingData(null);
    } catch {
      toast.error("Failed to update registry");
    }
  };

  if (isCourseLoading) {
    return (
      <div className="space-y-10">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
          <AlertCircle className="size-10 text-slate-200" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Course not found</h2>
        <p className="text-slate-500 mt-2 font-medium">The curriculum you are looking for has been moved or deleted.</p>
        <Link href="/admin/courses">
          <Button variant="outline" className="mt-8 rounded-xl font-bold">
            <ArrowLeft className="size-4 mr-2" />
            Back to Registry
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            href="/admin/courses"
            className="text-xs font-black text-slate-400 hover:text-blue-600 flex items-center gap-1.5 uppercase tracking-widest mb-3 transition-colors"
          >
            <ArrowLeft className="size-3" />
            Registry
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {String(c.title ?? "Untitled Builder")}
            </h1>
            <Badge
              className={cn(
                "rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-tighter border",
                c.status === "active" 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                  : "bg-slate-100 text-slate-500 border-slate-200"
              )}
            >
              {statusLabel(String(c.status ?? ""))}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-6 bg-white/50 backdrop-blur-xl p-2 pl-6 rounded-3xl border border-white shadow-sm">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Build Status</span>
            <span className="text-xs font-bold text-slate-900">{lessons.length} Lessons Configured</span>
          </div>
          <ProgressIndicator />
        </div>
      </header>

      <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl w-fit border border-slate-200/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "curriculum" && (
                <CurriculumTab 
                  courseId={courseId} 
                  lessons={lessons} 
                  onReorder={handleReorder}
                  isLoading={isLessonsLoading}
                  onEditLesson={(lesson: any) => {
                    setSelectedLesson(lesson);
                    setIsEditorOpen(true);
                  }}
                />
              )}
              {activeTab === "basic" && (
                <BasicTab 
                  course={c} 
                  onChanges={(data: any) => {
                    setHasChanges(true);
                    setPendingData({ ...pendingData, ...data });
                  }} 
                />
              )}
              {activeTab === "pricing" && (
                <PricingTab 
                  course={c} 
                  onChanges={(data: any) => {
                    setHasChanges(true);
                    setPendingData({ ...pendingData, ...data });
                  }} 
                />
              )}
              {activeTab === "media" && <MediaTab course={c} />}
              {activeTab === "settings" && (
                <SettingsTab 
                  course={c} 
                  onStatusChange={(status: any) => updateStatus.mutate({ id: courseId, data: { status } })} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="space-y-6">
          <Card className="p-6 bg-white/60 backdrop-blur-xl border-white rounded-3xl shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Course Preview</h3>
            <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
              <div className="aspect-video bg-slate-50 flex items-center justify-center text-slate-300">
                <ImageIcon className="size-10 opacity-20" />
              </div>
              <div className="p-4 space-y-2">
                <p className="text-sm font-bold text-slate-900 truncate">{String(c.title ?? "")}</p>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {String(c.category ?? "") || "General"}
                  </p>
                  {c.price != null && (
                    <p className="text-xs font-black text-blue-600">${Number(c.price).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-xl font-bold text-xs h-10 border-slate-200">
              <ExternalLink className="size-3.5 mr-2" />
              Live Preview
            </Button>
          </Card>

          <Card className="p-6 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <CheckCircle2 className="size-4 text-white" />
              </div>
              <h3 className="text-sm font-bold tracking-tight">System Info</h3>
            </div>
            <div className="space-y-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <div className="flex justify-between">
                <span>Unique ID</span>
                <span className="text-white font-bold">{String(c.id ?? "").slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-white font-bold">{new Date(c.createdAt as string).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Visibility</span>
                <span className={cn("font-bold", c.status === "active" ? "text-emerald-400" : "text-amber-400")}>
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
        }}
      >
        Registry modifications detected.
      </UnsavePopup>
    </div>
  );
}

function CurriculumTab({ courseId, lessons, onReorder, isLoading, onEditLesson }: any) {
  const createLesson = useCreateLesson();
  const toggleVisibility = useToggleLessonVisibility();
  const [newLessonTitle, setNewLessonTitle] = useState("");

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return;
    try {
      await createLesson.mutateAsync({ 
        courseId, 
        data: { title: newLessonTitle, status: "draft" } 
      });
      setNewLessonTitle("");
      toast.success("Lesson added to curriculum");
    } catch {
      toast.error("Failed to add lesson");
    }
  };

  if (isLoading) return <Skeleton className="h-[500px] w-full rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Curriculum Builder</h2>
          <p className="text-sm text-slate-400 font-bold mt-1">Directly manage and sequence your course lessons.</p>
        </div>
        
        <MorphingPopover>
          <MorphingPopoverTrigger className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-10 font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
            <Plus className="size-4" />
            Add Lesson
          </MorphingPopoverTrigger>
          <MorphingPopoverContent className="w-80 p-6 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Quick Add Lesson</h3>
            <div className="space-y-4">
              <Input 
                placeholder="Lesson title (e.g. Intro to UI)..." 
                className="rounded-xl border-slate-200 h-11"
                value={newLessonTitle}
                onChange={(e) => setNewLessonTitle(e.target.value)}
              />
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-11"
                onClick={handleAddLesson}
                disabled={createLesson.isPending}
              >
                {createLesson.isPending ? "Synchronizing..." : "Confirm Lesson"}
              </Button>
            </div>
          </MorphingPopoverContent>
        </MorphingPopover>
      </div>

      <Card className="bg-white/40 backdrop-blur-sm border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between px-8">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sequence Order</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lessons.length} Total Lessons</span>
        </div>
        
        <Reorder.Group 
          axis="y" 
          values={lessons} 
          onReorder={onReorder}
          className="divide-y divide-slate-100/50"
        >
          {lessons.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
              <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                <BookOpen className="size-8 text-slate-200" />
              </div>
              <p className="text-sm font-bold text-slate-900">Curriculum is empty</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Start by adding your first lesson using the builder above.</p>
            </div>
          ) : (
            lessons.map((lesson: any, index: number) => (
              <Reorder.Item 
                key={lesson.id} 
                value={lesson}
                className="group bg-white/40 hover:bg-white transition-colors cursor-default"
              >
                <div className="flex items-center gap-4 py-4 px-6">
                  <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-slate-500 transition-colors">
                    <GripVertical className="size-4" />
                  </div>
                  <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{lesson.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                        lesson.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {lesson.status === "active" ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleVisibility.mutate(lesson.id)}
                      className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all"
                      title={lesson.status === "active" ? "Hide from students" : "Make visible"}
                    >
                      {lesson.status === "active" ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                    </button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditLesson(lesson)}
                      className="h-8 rounded-lg font-bold text-xs hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit3 className="size-3.5 mr-2" />
                      Edit Lesson
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

function BasicTab({ course, onChanges }: any) {
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
    <Card className="p-10 bg-white/60 backdrop-blur-xl border-white rounded-3xl shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">General Information</h2>
        <p className="text-sm text-slate-400 font-bold mt-1">Primary details that define your course identity.</p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Title</label>
          <Input 
            value={title} 
            onChange={(e) => handleChange("title", e.target.value)} 
            className="h-12 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Course Description</label>
          <Textarea
            value={description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={6}
            className="rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-medium resize-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Market Category</label>
          <Input 
            value={category} 
            onChange={(e) => handleChange("category", e.target.value)} 
            className="h-12 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-bold"
          />
        </div>
      </div>
    </Card>
  );
}

function PricingTab({ course, onChanges }: any) {
  const [price, setPrice] = useState(String(course.currentPrice ?? ""));
  const [discountPrice, setDiscountPrice] = useState(String(course.originalPrice ?? ""));

  const handleChange = (field: string, value: string) => {
    if (field === "currentPrice") setPrice(value);
    if (field === "originalPrice") setDiscountPrice(value);
    onChanges({ [field]: value ? Number(value) : undefined });
  };

  return (
    <Card className="p-10 bg-white/60 backdrop-blur-xl border-white rounded-3xl shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Financial Configuration</h2>
        <p className="text-sm text-slate-400 font-bold mt-1">Set the value and competitive pricing for this curriculum.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standard Price ($)</label>
          <div className="relative group">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => handleChange("currentPrice", e.target.value)}
              className="h-14 pl-10 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-black text-lg"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Original Value ($)</label>
          <div className="relative group">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors" />
            <Input
              type="number"
              step="0.01"
              value={discountPrice}
              onChange={(e) => handleChange("originalPrice", e.target.value)}
              className="h-14 pl-10 rounded-2xl border-slate-200 focus:ring-4 focus:ring-slate-500/5 font-black text-lg text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
        <p className="text-xs font-bold text-blue-600 leading-relaxed">
          Pro Tip: Setting a promotional price can increase conversion by up to 30%. Ensure the discount feels significant to the standard price.
        </p>
      </div>
    </Card>
  );
}

function MediaTab({ course }: any) {
  return (
    <Card className="p-10 bg-white/60 backdrop-blur-xl border-white rounded-3xl shadow-sm space-y-10">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Visual Identity</h2>
        <p className="text-sm text-slate-400 font-bold mt-1">Manage the cover art and video previews for your course.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Course Thumbnail</label>
          <div className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-6 transition-all hover:bg-slate-100/50 hover:border-blue-400 cursor-pointer group">
            <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="size-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <p className="text-sm font-bold text-slate-900">Upload Cover Art</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">Recommended: 1920x1080px</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Video Preview</label>
          <div className="aspect-video rounded-3xl bg-slate-900 flex flex-col items-center justify-center text-center p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="size-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-all cursor-pointer">
                <PlayCircle className="size-8 text-white" />
              </div>
              <p className="text-sm font-bold text-white">Trailer Configuration</p>
              <p className="text-[10px] text-white/50 font-bold uppercase mt-1 tracking-tighter">MP4 or Vimeo ID required</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SettingsTab({ course, onStatusChange }: any) {
  return (
    <Card className="p-10 bg-white/60 backdrop-blur-xl border-white rounded-3xl shadow-sm space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Course Management</h2>
        <p className="text-sm text-slate-400 font-bold mt-1">Control the lifecycle and operational state of your course.</p>
      </div>

      <div className="space-y-6">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-4">Operational Status</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: "draft", label: "Draft", color: "slate" },
            { id: "active", label: "Active", color: "emerald" },
            { id: "inactive", label: "Inactive", color: "amber" },
            { id: "archived", label: "Archived", color: "rose" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => onStatusChange(s.id)}
              className={cn(
                "flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-300 gap-3",
                course.status === s.id
                  ? `bg-${s.color}-50 border-${s.color}-200 text-${s.color}-700 ring-4 ring-${s.color}-500/5 scale-105 shadow-lg shadow-${s.color}-500/10`
                  : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "size-10 rounded-2xl flex items-center justify-center",
                course.status === s.id ? `bg-${s.color}-500 text-white` : "bg-slate-100 text-slate-400"
              )}>
                {course.status === s.id ? <CheckCircle2 className="size-5" /> : <div className="size-2 rounded-full bg-current" />}
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
        <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2">Danger Zone</h4>
        <p className="text-xs font-medium text-rose-500 leading-relaxed">
          Archiving a course will hide it from all public lists and disable new enrollments. This action is reversible but should be performed with caution.
        </p>
      </div>
    </Card>
  );
}
