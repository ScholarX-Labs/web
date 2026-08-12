import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/dal';
import { LessonTasksFactory } from '@/domain/courses/lesson-tasks/lesson-tasks.factory';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  instructions: z.string().nullable().optional(),
  pointsAwarded: z.number().int().min(0).optional(),
  isOptional: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  config: z.record(z.string(), z.any()).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string; taskId: string }> }
) {
  try {
    const session = await requireRole("admin");
    const { taskId } = await context.params;
    const body = await request.json();

    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const taskRepository = LessonTasksFactory.getTaskRepository();
    
    // We update without explicitly enforcing optimistic concurrency on the client side for this MVP,
    // so we'll just omit expectedVersion. In a real app we'd pass it.
    const updatedTask = await taskRepository.update(taskId, {
      ...parsed.data,
      updatedBy: session.user.id,
    });

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error('[AdminTask PATCH]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string; taskId: string }> }
) {
  try {
    await requireRole("admin");
    const { taskId } = await context.params;

    const taskRepository = LessonTasksFactory.getTaskRepository();
    
    // We soft-delete or hard-delete via repository
    await taskRepository.delete(taskId);

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error('[AdminTask DELETE]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
