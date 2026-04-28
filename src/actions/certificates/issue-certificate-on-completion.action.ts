"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { CourseCompletionEvaluatedEvent } from "@/domain/certificates/contracts";
import { CertificateIssuanceService } from "@/domain/certificates/application/certificate-issuance.service";

/**
 * issueCertificateOnCompletion — Server Action
 *
 * Called by the client (useLessonProgress hook via LessonClientBridge)
 * when the video watch threshold is crossed.
 *
 * This is the bridge between the frontend telemetry and the backend
 * certificate issuance pipeline. It:
 * 1. Resolves the authenticated user session server-side (no token exposure).
 * 2. Constructs a CourseCompletionEvaluatedEvent from the input.
 * 3. Delegates to CertificateIssuanceService for synchronous issuance.
 * 4. Returns a slim result (success/id) for the celebration modal.
 *
 * Design: Single Responsibility — this action only bridges session +
 * domain call. All business logic lives in the service layer.
 */
export async function issueCertificateOnCompletion(input: {
  courseId: string;
  programName: string;
  seasonNumber: number;
  role: "mentee" | "mentor";
}): Promise<{
  success: boolean;
  certificateId?: string;
  shortId?: string;
  verificationUrl?: string;
  message: string;
}> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return { success: false, message: "Not authenticated." };
  }

  const event: CourseCompletionEvaluatedEvent = {
    userId: session.user.id,
    recipientName: session.user.name,
    recipientEmail: session.user.email,
    courseId: input.courseId,
    programName: input.programName,
    seasonNumber: input.seasonNumber,
    role: input.role,
    completionDate: new Date(),
  };

  try {
    const service = new CertificateIssuanceService();
    const result = await service.issue({
      userId: event.userId,
      recipientName: event.recipientName,
      recipientEmail: event.recipientEmail,
      courseId: event.courseId,
      programName: event.programName,
      seasonNumber: event.seasonNumber,
      role: event.role,
      completionDate: event.completionDate,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scholarx.lk";

    return {
      success: result.success,
      certificateId: result.certificateId || undefined,
      shortId: result.shortId || undefined,
      verificationUrl: result.certificateId
        ? `${baseUrl}/verify/${result.certificateId}`
        : undefined,
      message: result.message,
    };
  } catch (err) {
    console.error("[issueCertificateOnCompletion]", err);
    return {
      success: false,
      message: "Certificate issuance failed. Please contact support.",
    };
  }
}
