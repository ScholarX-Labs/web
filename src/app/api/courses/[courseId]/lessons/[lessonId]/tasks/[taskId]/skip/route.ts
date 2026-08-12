import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LessonTasksFactory } from "@/domain/courses/lesson-tasks/lesson-tasks.factory";

interface RouteContext {
  params: Promise<{ courseId: string; lessonId: string; taskId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: "Authentication required" } },
        { status: 401 },
      );
    }

    const { taskId, courseId } = await context.params;
    const commandService = LessonTasksFactory.getCommandService();

    await commandService.markAsSkipped(userId, courseId, taskId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[lesson-tasks] POST skip failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Internal server error" },
      },
      { status: error.code === 'TASK_NOT_FOUND' ? 404 : 400 },
    );
  }
}
