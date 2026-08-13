import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LessonTasksFactory } from "@/domain/courses/lesson-tasks/lesson-tasks.factory";

interface RouteContext {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    const { lessonId } = await context.params;
    
    const queryService = LessonTasksFactory.getQueryService();
    const tasks = await queryService.getTasksForLesson(lessonId, userId);

    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error("[lesson-tasks] GET failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" },
      },
      { status: 500 },
    );
  }
}
