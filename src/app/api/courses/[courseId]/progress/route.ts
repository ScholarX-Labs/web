import { NextRequest, NextResponse } from "next/server";
import { createCourseProgressDomain } from "@/domain/courses";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          numericCode: 9002,
          statusCode: 401,
          message: "Authentication required",
        },
      },
      { status: 401 },
    );
  }

  const { courseId } = await context.params;
  const domain = createCourseProgressDomain();
  const [course, lessons] = await Promise.all([
    domain.progressQuery.getCourseProgress(userId, courseId),
    domain.progressQuery.getLessonProgress(userId, courseId),
  ]);

  return NextResponse.json(
    {
      course,
      lessons,
    },
    { status: 200 },
  );
}
