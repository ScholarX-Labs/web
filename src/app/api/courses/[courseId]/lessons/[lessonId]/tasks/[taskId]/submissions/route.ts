import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { LessonTasksFactory } from "@/domain/courses/lesson-tasks/lesson-tasks.factory";

interface RouteContext {
  params: Promise<{ courseId: string; lessonId: string; taskId: string }>;
}

const submissionSchema = z.object({
  answer: z.any(),
  clientEventId: z.string().uuid().optional(),
});

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
    const body = await request.json();
    const result = submissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: "Invalid payload", details: result.error.flatten() } },
        { status: 400 },
      );
    }

    const { answer, clientEventId } = result.data;
    const commandService = LessonTasksFactory.getCommandService();

    const submissionResult = await commandService.submitAnswer(
      userId,
      courseId,
      taskId,
      answer,
      clientEventId
    );

    return NextResponse.json({ success: true, data: submissionResult });
  } catch (error: any) {
    console.error("[lesson-tasks] POST submission failed:", error);
    
    // In a real app, map domain errors to specific HTTP codes
    const status = error.code === 'TASK_NOT_FOUND' ? 404 : 
                   (error.code === 'INVALID_SUBMISSION' || error.code === 'TASK_NOT_PUBLISHED') ? 400 : 500;
                   
    return NextResponse.json(
      {
        success: false,
        error: { message: error.message || "Internal server error", code: error.code },
      },
      { status },
    );
  }
}
