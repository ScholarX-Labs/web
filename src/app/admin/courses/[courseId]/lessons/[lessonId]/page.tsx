import { LessonTaskEditor } from "@/components/admin/tasks/lesson-task-editor";

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default async function AdminLessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
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

      <LessonTaskEditor courseId={courseId} lessonId={lessonId} />
    </div>
  );
}
