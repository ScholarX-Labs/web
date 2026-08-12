import { LessonTaskEditor } from "@/components/admin/tasks/lesson-task-editor";

interface LessonPageProps {
  params: {
    courseId: string;
    lessonId: string;
  };
}

export default function AdminLessonPage({ params }: LessonPageProps) {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-[1000] text-slate-900 tracking-tight">
          Lesson Tasks
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Manage tasks, configurations, and ordering for this lesson.
        </p>
      </div>

      <LessonTaskEditor courseId={params.courseId} lessonId={params.lessonId} />
    </div>
  );
}
