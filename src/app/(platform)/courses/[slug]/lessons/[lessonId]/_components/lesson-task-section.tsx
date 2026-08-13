"use client";

import { useLessonTasks } from "@/components/hooks/use-lesson-tasks";
import { TaskCard } from "./task-card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LessonTaskSectionProps {
  courseId: string;
  lessonId: string;
}

export function LessonTaskSection({ courseId, lessonId }: LessonTaskSectionProps) {
  const { tasks, isLoading, isError } = useLessonTasks(courseId, lessonId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load lesson tasks. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const publishedTasks = tasks.filter(t => t.status === "published");

  if (publishedTasks.length === 0) {
    return null; // Or return a fallback UI
  }

  return (
    <div className="space-y-6 mt-8">
      <div>
        <h3 className="text-xl font-bold tracking-tight mb-2">Lesson Tasks</h3>
        <p className="text-muted-foreground">
          Complete the following tasks to reinforce your learning and earn points.
        </p>
      </div>
      
      <div className="space-y-4">
        {publishedTasks.map((task) => (
          <TaskCard 
            key={task.id} 
            task={task} 
            courseId={courseId} 
            lessonId={lessonId} 
          />
        ))}
      </div>
    </div>
  );
}
