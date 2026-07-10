import { NextRequest, NextResponse } from "next/server";
import { LeaderboardWindow } from "@/domain/leaderboard/contracts/leaderboard.types";
import { createLeaderboardDomain } from "@/domain/leaderboard/factory";
import { auth } from "@/lib/auth";
import getPostHogClient from "@/lib/posthog-server";

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
          statusCode: 401,
          message: "Authentication required",
        },
      },
      { status: 401 },
    );
  }

  const { courseId } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const windowParam = searchParams.get("window") || "all";

  if (!["all", "week", "month"].includes(windowParam)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          statusCode: 400,
          message: "Invalid window parameter",
        },
      },
      { status: 400 },
    );
  }

  const window = windowParam as LeaderboardWindow;
  const isAdmin = session?.user?.role === "admin";
  const domain = createLeaderboardDomain();

  try {
    const result = await domain.query.getTopEntries(courseId, window, 10, userId, isAdmin);
    
    // Fire analytics event
    const ph = getPostHogClient();
    if (ph && userId) {
      // Need to compute userRank
      let userRank = null;
      if (userId) {
        const myRankEntry = await domain.query.getMyRank(courseId, window, userId);
        if (myRankEntry) userRank = myRankEntry.rank;
      }

      ph.capture({
        distinctId: userId,
        event: 'leaderboard_viewed',
        properties: {
          courseId,
          window,
          userRank,
        },
      });
      // Important: posthog-node needs to flush before serverless execution ends
      await ph.flush();
    }

    return NextResponse.json(
      {
        entries: result.entries,
        updatedAt: result.updatedAt,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Leaderboard API] error fetching top entries:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: (err as { code?: string }).code || "INTERNAL_ERROR",
          statusCode: 500,
          message: err.message || "Failed to fetch leaderboard",
        },
      },
      { status: 500 }
    );
  }
}
