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
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'csv';

    const exportService = LessonTasksFactory.getExportService();

    if (format === 'json') {
      const data = await exportService.exportSubmissionsAsJson(taskId);
      return new NextResponse(data, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="task-${taskId}-submissions.json"`,
        },
      });
    }

    // Default to CSV
    const data = await exportService.exportSubmissionsAsCsv(taskId);
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="task-${taskId}-submissions.csv"`,
      },
    });

  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    console.error('[Admin Submissions Export GET]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
