"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminLessonTasks } from "@/components/hooks/use-admin-lesson-tasks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { McqForm } from "./task-type-form/mcq-form";
import { WrittenForm } from "./task-type-form/written-form";
import { SwotForm } from "./task-type-form/swot-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassCard } from "@/components/ui/glass-panel";
import { Reorder } from "framer-motion";
import { Loader2, Trash2, GripVertical, Settings, Plus } from "lucide-react";
import type { TaskType, TaskStatus, TaskConfig, AdminTaskPayload, McqTaskConfig, WrittenTaskConfig, SwotTaskConfig, LinkTaskConfig } from "@/domain/courses/lesson-tasks/contracts/lesson-tasks.types";

interface LessonTaskEditorProps {
  courseId: string;
  lessonId: string;
}

export function LessonTaskEditor({ courseId, lessonId }: LessonTaskEditorProps) {
  const { tasks, isLoading, isError, error, refetch, createTask, updateTask, deleteTask, reorderTasks } = useAdminLessonTasks(courseId, lessonId);

  // New task form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Local state for smooth drag-and-drop
  const [localTasks, setLocalTasks] = useState(tasks);
  
  // Sync localTasks when upstream tasks change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const isReorderingRef = useRef(false);
  const nextOrderIdsRef = useRef<string[] | null>(null);

  const processReorder = async (orderIds: string[]) => {
    if (isReorderingRef.current) {
      nextOrderIdsRef.current = orderIds;
      return;
    }
    
    isReorderingRef.current = true;
    try {
      await reorderTasks(orderIds);
    } catch {
      toast.error("Failed to save task order");
      setLocalTasks(tasks); // Revert on failure
    } finally {
      isReorderingRef.current = false;
      if (nextOrderIdsRef.current) {
        const nextIds = nextOrderIdsRef.current;
        nextOrderIdsRef.current = null;
        processReorder(nextIds);
      }
    }
  };

  const handleReorder = (newOrder: typeof tasks) => {
    setLocalTasks(newOrder);
    processReorder(newOrder.map(t => t.id));
  };
  const [type, setType] = useState<TaskType>("mcq");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState(10);
  const [isOptional, setIsOptional] = useState(false);
  const [status, setStatus] = useState<TaskStatus>("published");
  const [config, setConfig] = useState<TaskConfig>({ options: [], correctOptionId: "" });

  const handleEditClick = (task: AdminTaskPayload) => {
    setEditingTaskId(task.id);
    setType(task.type);
    setTitle(task.title);
    setInstructions(task.instructions || "");
    setPointsAwarded(task.pointsAwarded);
    setIsOptional(task.isOptional);
    setStatus(task.status);
    setConfig(task.config);
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingTaskId(null);
    setType("mcq");
    setTitle("");
    setInstructions("");
    setPointsAwarded(10);
    setIsOptional(false);
    setStatus("published");
    setConfig({ options: [], correctOptionId: "" });
    setIsFormOpen(!isFormOpen);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    try {
      const payload = {
        type,
        title,
        instructions,
        pointsAwarded,
        isOptional,
        status,
        config,
      };

      if (editingTaskId) {
        await updateTask({ taskId: editingTaskId, payload });
        toast.success("Task updated successfully");
      } else {
        await createTask(payload);
        toast.success("Task created successfully");
      }
      
      setIsFormOpen(false);
      setEditingTaskId(null);
      // Reset form
      setTitle("");
      setInstructions("");
      setConfig({});
    } catch (error: unknown) {
      toast.error((error as Error).message || `Failed to ${editingTaskId ? 'update' : 'create'} task`);
      console.error(`Failed to ${editingTaskId ? 'update' : 'create'} task`, error);
    }
  };

  const handleTypeChange = (newType: TaskType) => {
    setType(newType);
    if (newType === "mcq") setConfig({ options: [], correctOptionId: "" });
    else if (newType === "written") setConfig({});
    else if (newType === "swot") setConfig({ requiredCategories: ["strengths", "weaknesses"] });
    else if (newType === "link") setConfig({ urlTemplate: "" });
  };

  const renderConfigForm = () => {
    switch (type) {
      case "mcq":
        return <McqForm config={config as McqTaskConfig} onChange={setConfig} />;
      case "written":
        return <WrittenForm config={config as WrittenTaskConfig} onChange={setConfig} />;
      case "swot":
        return <SwotForm config={config as SwotTaskConfig} onChange={setConfig} />;
      case "link":
        return (
          <div className="space-y-3">
            <Label className="text-slate-600 font-medium">Link URL</Label>
            <Input
              className="bg-white"
              type="url"
              value={(config as LinkTaskConfig).urlTemplate || ""}
              onChange={(e) => setConfig({ ...(config as LinkTaskConfig), urlTemplate: e.target.value })}
              placeholder="https://..."
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-red-200 bg-red-50/50 rounded-2xl p-6 text-center space-y-4">
        <div className="space-y-2">
          <p className="text-red-800 font-medium">Failed to load tasks</p>
          {error && <p className="text-sm text-red-600">{(error as Error).message}</p>}
        </div>
        <Button onClick={() => refetch()} variant="outline" className="border-red-200 text-red-800 hover:bg-red-50">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Lesson Tasks</h3>
        <Button onClick={handleAddNewClick} variant={isFormOpen ? "outline" : "default"}>
          {isFormOpen ? "Cancel" : "Add Task"}
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        if (!open) {
          setIsFormOpen(false);
          setEditingTaskId(null);
        }
      }}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl p-0 flex flex-col rounded-2xl">
          <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl tracking-tight text-slate-800">
              {editingTaskId ? "Edit Task" : "Create New Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3 col-span-2 sm:col-span-1">
                  <Label className="text-slate-600 font-medium">Task Type</Label>
                  <Tabs value={type} onValueChange={(val) => handleTypeChange(val as TaskType)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 p-1">
                      <TabsTrigger value="mcq" className="text-xs">MCQ</TabsTrigger>
                      <TabsTrigger value="written" className="text-xs">Written</TabsTrigger>
                      <TabsTrigger value="swot" className="text-xs">SWOT</TabsTrigger>
                      <TabsTrigger value="link" className="text-xs">External Link</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="space-y-3 col-span-2 sm:col-span-1">
                  <Label className="text-slate-600 font-medium">Status</Label>
                  <Select value={status} onValueChange={(val: TaskStatus) => setStatus(val)}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-600 font-medium">Title</Label>
                <Input className="bg-white" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Test your knowledge" />
              </div>

              <div className="space-y-3">
                <Label className="text-slate-600 font-medium">Instructions (Optional)</Label>
                <Textarea
                  className="bg-white min-h-[100px]"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Explain what the learner needs to do..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-slate-600 font-medium">Points Awarded</Label>
                  <Input
                    className="bg-white"
                    type="number"
                    value={pointsAwarded}
                    onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center space-x-3 pt-9">
                  <Switch checked={isOptional} onCheckedChange={setIsOptional} id="optional" />
                  <Label htmlFor="optional" className="text-slate-600 font-medium cursor-pointer">Optional Task</Label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h4 className="text-sm font-semibold mb-4 text-slate-800">Configuration</h4>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {renderConfigForm()}
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 p-6 bg-slate-50/80 flex justify-end gap-3 mt-auto rounded-b-2xl">
            <Button variant="outline" onClick={() => {
              setIsFormOpen(false);
              setEditingTaskId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {editingTaskId ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {localTasks.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed rounded-2xl text-slate-400 bg-slate-50/50">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Settings className="w-6 h-6 text-slate-300" />
              </div>
              <p>No tasks have been added to this lesson yet.</p>
              <Button onClick={handleAddNewClick} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add First Task
              </Button>
            </div>
          </div>
        ) : (
          <Reorder.Group axis="y" values={localTasks} onReorder={handleReorder} className="space-y-3">
            {localTasks.map((task) => (
              <Reorder.Item key={task.id} value={task}>
                <GlassCard className="relative group p-0 overflow-hidden transition-all duration-300 hover:shadow-md border border-slate-200/60">
                  <div className="p-4 flex items-center gap-4 bg-white/40 backdrop-blur-sm">
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 group-hover:text-indigo-400 transition-colors p-1">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-slate-800 truncate">{task.title}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          task.type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                          task.type === 'written' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {task.type}
                        </span>
                        {task.status === "draft" && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                        {task.isOptional && (
                          <span className="text-[10px] font-bold uppercase tracking-wider border border-slate-200 text-slate-400 px-2 py-0.5 rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                      {task.instructions && (
                        <p className="text-sm text-slate-500 truncate">{task.instructions}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-600 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                        {task.pointsAwarded} pts
                      </span>
                      <div className="flex opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(task)} className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            try {
                              await deleteTask(task.id);
                              toast.success("Task deleted successfully");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Failed to delete task");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
