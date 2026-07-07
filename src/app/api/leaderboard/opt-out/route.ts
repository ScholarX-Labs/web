import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLeaderboardDomain } from "@/domain/leaderboard/factory";
import { auth } from "@/lib/auth";
import getPostHogClient from "@/lib/posthog-server";

const optOutSchema = z.object({
  courseId: z.string().min(1),
  isAnonymous: z.boolean(),
});

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const result = optOutSchema.safeParse(body);

    if (!result.success) {
      console.error("[OptOut API] Validation error:", result.error);
      return new NextResponse(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { courseId, isAnonymous } = result.data;
    const domain = createLeaderboardDomain();

    if (isAnonymous) {
      await domain.command.optOut(courseId, session.user.id);
    } else {
      await domain.command.optIn(courseId, session.user.id);
    }

    const ph = getPostHogClient();
    if (ph) {
      ph.capture({
        distinctId: session.user.id,
        event: 'leaderboard_opt_out_toggled',
        properties: {
          courseId,
          isAnonymous,
        },
      });
      await ph.flush();
    }

    return new NextResponse(JSON.stringify({ success: true, isAnonymous }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[OptOut API] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
