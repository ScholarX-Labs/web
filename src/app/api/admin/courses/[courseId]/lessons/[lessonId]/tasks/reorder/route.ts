import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/dal';
import { LessonTasksFactory } from '@/domain/courses/lesson-tasks/lesson-tasks.factory';
import { z } from 'zod';

const reorderSchema = z.object({
  orderedTaskIds: z.array(z.string().uuid()),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    await requireRole("admin");
    const { lessonId } = await context.params;
    const body = await request.json();

    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const taskRepository = LessonTasksFactory.getTaskRepository();

    // Loop through and update sortIndex sequentially
    // In a real app we'd use a transaction if possible, but doing them sequentially works for MVP.
    const promises = parsed.data.orderedTaskIds.map((taskId, index) =>
      taskRepository.update(taskId, { sortIndex: index })
    );

    await Promise.all(promises);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error('[AdminTasks Reorder POST]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
