"use client";

import { useState, useEffect } from "react";
import { useUpdateLesson } from "@/hooks/admin/use-admin-lessons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Save, 
  Video, 
  FileText, 
  Clock, 
  Lock, 
  Globe, 
  Layout, 
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LessonEditorProps {
  lesson: any;
  isOpen: boolean;
  onClose: () => void;
}

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
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        duration: lesson.duration || 0,
        isPrivate: lesson.isPrivate ?? true,
        status: lesson.status || "draft"
      });
    }
  }, [lesson]);

  const handleSave = async () => {
    try {
      await updateLesson.mutateAsync({
        id: lesson.id,
        data: formData,
      });
      toast.success("Module synchronized successfully");
      onClose();
    } catch {
      toast.error("Failed to update module");
    }
  };

  if (!lesson) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl border-l-0 bg-white/80 backdrop-blur-2xl shadow-2xl overflow-y-auto">
        <SheetHeader className="pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FileText className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">Edit Module</SheetTitle>
              <SheetDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                Refining: {lesson.title}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-8 py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Module Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-12 rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Summary (Short)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-medium resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Rich Content (Markdown)</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                placeholder="# Introduction..."
                className="rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-mono text-sm bg-slate-50/30"
              />
            </div>
          </div>

          <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-6">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Media & Lifecycle</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Video className="size-3.5 text-blue-500" />
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Video Endpoint URL</Label>
                </div>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://vimeo.com/..."
                  className="h-11 rounded-xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="size-3.5 text-slate-400" />
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration (min)</Label>
                  </div>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="h-11 rounded-xl border-slate-200 focus:ring-4 focus:ring-blue-500/5 font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    {formData.isPrivate ? <Lock className="size-3.5 text-amber-500" /> : <Globe className="size-3.5 text-emerald-500" />}
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Mode</Label>
                  </div>
                  <div className="h-11 flex items-center justify-between px-4 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold text-slate-900">{formData.isPrivate ? "Private" : "Public"}</span>
                    <Switch
                      checked={!formData.isPrivate}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: !checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Publishing Status</Label>
                <div className="flex gap-2">
                  {["draft", "active"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={cn(
                        "flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-[0.1em] transition-all",
                        formData.status === s 
                          ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                          : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={updateLesson.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-95"
            >
              <Save className="size-4 mr-2" />
              {updateLesson.isPending ? "Synchronizing..." : "Update Module"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-2xl h-14 px-8 border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
