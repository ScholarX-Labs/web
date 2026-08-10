import { NextRequest, NextResponse } from "next/server";
import { createNextCourseDomain } from "@/domain/courses/factory/next-course-domain.factory";
import { CourseMetricsSchema } from "@/domain/courses/contracts/course-metrics.contract";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const domain = createNextCourseDomain();
    
    // Fast path: cached or DB read
    const metrics = await domain.metrics.getCourseMetrics(courseId);

    if (!metrics) {
      return NextResponse.json(
        { error: "Course metrics not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[Counters API Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
