import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/dal';
import { LessonTasksFactory } from '@/domain/courses/lesson-tasks/lesson-tasks.factory';

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string; taskId: string }> }
) {
  try {
    await requireRole("admin");
    const { taskId } = await context.params;

    const submissionRepository = LessonTasksFactory.getTaskSubmissionRepository();
    const submissions = await submissionRepository.findByTaskId(taskId);

    return NextResponse.json(submissions);
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error('[Admin Submissions GET]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
