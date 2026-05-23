import { NextRequest, NextResponse } from "next/server";
import { createCourseProgressDomain } from "@/domain/courses";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
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
  const progress = await domain.progressQuery.getCourseProgress(userId, courseId);

  const completed =
    progress?.status === "completed" &&
    Boolean(progress.completedAt) &&
    Boolean(progress.certificateEligibleAt);

  const certificate = completed
    ? await createCertificateDomain().verificationQuery.getCourseCompletionCertificateForUser({
        userId,
        courseProgressId: progress.id,
      })
    : null;

  if (certificate) {
    return NextResponse.json({
      eligible: true,
      state: "issued",
      certificate,
      progress,
    });
  }

  return NextResponse.json({
    eligible: completed,
    state: completed ? "eligible_not_issued" : "not_eligible",
    certificate: null,
    progress,
  });
}
