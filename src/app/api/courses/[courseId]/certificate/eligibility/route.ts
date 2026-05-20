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
        eligible: false,
        state: "blocked",
        reason: "UNAUTHORIZED",
      },
      { status: 401 },
    );
  }

  const { courseId } = await context.params;
  const domain = createCourseProgressDomain();
  const [progress, certificate] = await Promise.all([
    domain.progressQuery.getCourseProgress(userId, courseId),
    domain.certificate.getCertificateByUserCourse(userId, courseId),
  ]);

  if (certificate) {
    return NextResponse.json({
      eligible: true,
      state: "issued",
      certificate,
      progress,
    });
  }

  const eligible =
    progress?.status === "completed" &&
    Boolean(progress.completedAt) &&
    Boolean(progress.certificateEligibleAt);

  return NextResponse.json({
    eligible,
    state: eligible ? "eligible_not_issued" : "not_eligible",
    certificate: null,
    progress,
  });
}
