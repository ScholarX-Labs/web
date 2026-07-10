import { NextRequest, NextResponse } from "next/server";
import { createLeaderboardDomain } from "@/domain/leaderboard/factory";
import { LeaderboardWindow } from "@/domain/leaderboard/contracts/leaderboard.types";
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
  const domain = createLeaderboardDomain();

  try {
    const myRank = await domain.query.getMyRank(courseId, window, userId);
    
    return NextResponse.json(myRank, { status: 200 });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Leaderboard API] error fetching my rank:", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: (err as any).code || "INTERNAL_ERROR",
          statusCode: 500,
          message: err.message || "Failed to fetch your rank",
        },
      },
      { status: 500 }
    );
  }
}
