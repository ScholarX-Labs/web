import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/dal';
import { LessonTasksFactory } from '@/domain/courses/lesson-tasks/lesson-tasks.factory';
import { z } from 'zod';

const createTaskSchema = z.object({
  type: z.enum(['mcq', 'written', 'swot', 'link']),
  title: z.string().min(1, 'Title is required').max(255),
  instructions: z.string().nullable().optional(),
  pointsAwarded: z.number().int().min(0).default(0),
  isOptional: z.boolean().default(true),
  sortIndex: z.number().int().default(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  config: z.record(z.string(), z.any()).default({}),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    await requireRole("admin");
    const { lessonId } = await context.params;

    const taskRepository = LessonTasksFactory.getTaskRepository();
    // For admin, we want all tasks regardless of published status
    const tasks = await taskRepository.findByLessonId(lessonId);

    // Return the raw tasks including config with answers (since it's admin)
    return NextResponse.json(tasks);
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error('[AdminTasks GET]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const session = await requireRole("admin");
    const { lessonId } = await context.params;
    const body = await request.json();

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const taskRepository = LessonTasksFactory.getTaskRepository();

    // Determine the next sort index if not explicitly provided
    let sortIndex = parsed.data.sortIndex;
    if (sortIndex === 0) {
      const existingTasks = await taskRepository.findByLessonId(lessonId);
      sortIndex = existingTasks.length;
    }

    const newTask = await taskRepository.create({
      lessonId,
      type: parsed.data.type,
      title: parsed.data.title,
      instructions: parsed.data.instructions || null,
      pointsAwarded: parsed.data.pointsAwarded,
      isOptional: parsed.data.isOptional,
      sortIndex,
      status: parsed.data.status,
      config: parsed.data.config as any,
      version: 1,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error('[AdminTasks POST]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
