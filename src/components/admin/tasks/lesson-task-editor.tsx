"use client";

import { useState } from "react";
import { useAdminLessonTasks } from "@/components/hooks/use-admin-lesson-tasks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { McqForm } from "./task-type-form/mcq-form";
import { WrittenForm } from "./task-type-form/written-form";
import { SwotForm } from "./task-type-form/swot-form";
import { Loader2, Trash2, GripVertical, Settings } from "lucide-react";
import type { TaskType } from "@/domain/courses/lesson-tasks/contracts/lesson-tasks.types";

interface LessonTaskEditorProps {
  courseId: string;
  lessonId: string;
}

export function LessonTaskEditor({ courseId, lessonId }: LessonTaskEditorProps) {
  const { tasks, isLoading, createTask, deleteTask } = useAdminLessonTasks(courseId, lessonId);

  // New task form state
  const [isCreating, setIsCreating] = useState(false);
  const [type, setType] = useState<TaskType>("mcq");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [pointsAwarded, setPointsAwarded] = useState(10);
  const [isOptional, setIsOptional] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [config, setConfig] = useState<Record<string, unknown>>({});

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    try {
      await createTask({
        type,
        title,
        instructions,
        pointsAwarded,
        isOptional,
        status,
        config,
      });
      setIsCreating(false);
      // Reset form
      setTitle("");
      setInstructions("");
      setConfig({});
      toast.success("Task created successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
      console.error("Failed to create task", error);
    }
  };

  const handleTypeChange = (newType: TaskType) => {
    setType(newType);
    if (newType === "mcq") setConfig({ options: [], correctOptionId: "" });
    else if (newType === "written") setConfig({});
    else if (newType === "swot") setConfig({ requiredCategories: ["strengths", "weaknesses"] });
    else if (newType === "link") setConfig({ url: "" });
  };

  const renderConfigForm = () => {
    switch (type) {
      case "mcq":
        return <McqForm config={config as any} onChange={setConfig} />;
      case "written":
        return <WrittenForm config={config as any} onChange={setConfig} />;
      case "swot":
        return <SwotForm config={config as any} onChange={setConfig} />;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Lesson Tasks</h3>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
          {isCreating ? "Cancel" : "Add Task"}
        </Button>
      </div>

      {isCreating && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Create New Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(val) => handleTypeChange(val as TaskType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="written">Written Response</SelectItem>
                    <SelectItem value="swot">SWOT Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(val: "draft" | "published") => setStatus(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Test your knowledge" />
            </div>

            <div className="space-y-2">
              <Label>Instructions (Optional)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Explain what the learner needs to do..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Awarded</Label>
                <Input
                  type="number"
                  value={pointsAwarded}
                  onChange={(e) => setPointsAwarded(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch checked={isOptional} onCheckedChange={setIsOptional} id="optional" />
                <Label htmlFor="optional">Optional Task</Label>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-4">Configuration</h4>
              {renderConfigForm()}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!title}>
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {tasks.length === 0 && !isCreating ? (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
            No tasks have been added to this lesson yet.
          </div>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="relative group">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{task.title}</span>
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">
                      {task.type}
                    </span>
                    {task.status === "draft" && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
                        Draft
                      </span>
                    )}
                  </div>
                  {task.instructions && (
                    <p className="text-sm text-muted-foreground truncate">{task.instructions}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{task.pointsAwarded} pts</span>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
