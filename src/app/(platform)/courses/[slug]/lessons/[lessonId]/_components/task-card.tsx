"use client";

import { McqTaskCard } from "./tasks/mcq-task-card";
import { WrittenTaskCard } from "./tasks/written-task-card";
import { SwotTaskCard } from "./tasks/swot-task-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TaskCardProps {
  task: any; // Using any for MVP, ideally use LessonTask from hook
  courseId: string;
  lessonId: string;
}

export function TaskCard({ task, courseId, lessonId }: TaskCardProps) {
  const renderTaskContent = () => {
    switch (task.taskType) {
      case "mcq":
        return <McqTaskCard task={task} courseId={courseId} lessonId={lessonId} />;
      case "written":
        return <WrittenTaskCard task={task} courseId={courseId} lessonId={lessonId} />;
      case "swot":
        return <SwotTaskCard task={task} courseId={courseId} lessonId={lessonId} />;
      default:
        return <div>Unsupported task type: {task.taskType}</div>;
    }
  };

  return (
    <Card className="mb-4 relative overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              {task.title}
              {task.isMandatory && (
                <Badge variant="destructive" className="ml-2">Mandatory</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </CardDescription>
          </div>
          <div className="text-sm font-medium bg-muted px-2 py-1 rounded-md">
            {task.pointsAwarded} pts
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderTaskContent()}
      </CardContent>
    </Card>
  );
}
