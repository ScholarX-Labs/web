import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLeaderboardDomain } from "@/domain/leaderboard/factory";

const pointEventSchema = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  activityType: z.enum(["quiz", "exam", "forum_post", "assignment_submit", "lesson_completion", "course_completion"]),
  points: z.number().positive(),
  idempotencyKey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // Simple internal-only protection
  const internalSecret = request.headers.get("x-internal-secret");
  if (internalSecret !== process.env.INTERNAL_API_SECRET) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const result = pointEventSchema.safeParse(body);

    if (!result.success) {
      console.error("[PointEvents API] Validation error:", result.error);
      return new NextResponse(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId, courseId, activityType, points, idempotencyKey } = result.data;
    const domain = createLeaderboardDomain();

    await domain.command.awardPoints({
      userId,
      courseId,
      activityType,
      points,
      idempotencyKey,
    });

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[PointEvents API] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
