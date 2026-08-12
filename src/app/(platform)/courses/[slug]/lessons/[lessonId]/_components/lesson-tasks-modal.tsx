"use client";

import { useLessonTasks } from "@/components/hooks/use-lesson-tasks";
import { TaskCard } from "./task-card";
import { Loader2, ListChecks } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LessonTasksModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lessonId: string;
}

export function LessonTasksModal({
  isOpen,
  onOpenChange,
  courseId,
  lessonId,
}: LessonTasksModalProps) {
  const { tasks, isLoading, isError } = useLessonTasks(courseId, lessonId);

  const publishedTasks = tasks.filter((t) => t.status === "published");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl flex flex-col">
        <DialogHeader className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="flex items-center gap-2 text-xl tracking-tight text-slate-800">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <ListChecks className="size-5 stroke-[2.5]" />
            </div>
            Lesson Tasks
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Complete the following tasks to reinforce your learning and earn points.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] overflow-y-auto px-6 py-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>
                Failed to load lesson tasks. Please try again later.
              </AlertDescription>
            </Alert>
          ) : publishedTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              No tasks available for this lesson.
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {publishedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  courseId={courseId}
                  lessonId={lessonId}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
