import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createNextCourseDomain } from "@/domain/courses/factory/next-course-domain.factory";

const courseIdSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    if (!courseIdSchema.safeParse(courseId).success) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }

    const domain = createNextCourseDomain();

    // Fast path: cached or DB read
    const metrics = await domain.metrics.getCourseMetrics(courseId);

    if (!metrics) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: metrics },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("[Counters API Error]", error);
    return NextResponse.json(
      { error: "service_unavailable" },
      { status: 500 }
    );
  }
}
