import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCourseProgressDomain,
  isNextCourseError,
} from "@/domain/courses";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ courseId: string; lessonId: string }>;
}

const progressBodySchema = z.object({
  eventType: z.enum([
    "heartbeat",
    "pause",
    "seek",
    "completion",
    "manual_complete",
  ]),
  clientEventId: z.uuid(),
  watchedPercentage: z.number().min(0).max(100).optional(),
  lastPosition: z.number().min(0).optional(),
  completed: z.boolean().optional(),
  completedAt: z.iso.datetime().nullable().optional(),
});

const canonicalize = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalize(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const requestHash = (value: unknown) =>
  createHash("sha256").update(canonicalize(value)).digest("hex");

const errorResponse = (error: unknown) => {
  if (isNextCourseError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          numericCode: error.numericCode,
          statusCode: error.statusCode,
          message: error.message,
          details: error.details ?? null,
        },
      },
      {
        status: error.statusCode,
        headers:
          error.code === "CONCURRENT_PROGRESS_UPDATE"
            ? { "Retry-After": "1" }
            : undefined,
      },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        numericCode: 9999,
        statusCode: 500,
        message: "Internal server error",
      },
    },
    { status: 500 },
  );
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
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

    const { courseId, lessonId } = await context.params;
    const rawBody = await request.json();
    const body = progressBodySchema.parse(rawBody);
    const domain = createCourseProgressDomain();
    const result = await domain.progressCommand.syncLessonProgress({
      userId,
      courseId,
      lessonId,
      eventType: body.eventType,
      clientEventId: body.clientEventId,
      requestHash: requestHash({ courseId, lessonId, ...body }),
      completed: body.completed,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      watchedPercentage: body.watchedPercentage,
      lastPosition: body.lastPosition,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            numericCode: 9005,
            statusCode: 400,
            message: "Invalid progress payload",
            details: z.flattenError(error),
          },
        },
        { status: 400 },
      );
    }

    console.error("[course-progress] POST failed:", error);
    return errorResponse(error);
  }
}
