"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createNextCertificateDomain } from "@/domain/certificates/factory/next-certificate-domain.factory";

/**
 * Returns all certificates for the currently authenticated user.
 * Call directly from Server Components — no API round-trip needed.
 */
export async function getUserCertificates() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return [];
  return createNextCertificateDomain().certificates.getUserCertificates(
    session.user.id,
  );
}

/**
 * Public verification — no auth required.
 * Returns a structured result with valid/invalid state and certificate details.
 */
export async function verifyCertificate(certificateId: string) {
  return createNextCertificateDomain().certificates.verifyCertificate(
    certificateId,
  );
}

/**
 * Marks a course as completed for the current user and issues a certificate.
 * Idempotent: safe to call multiple times.
 */
export async function markCourseCompleted(
  courseId: string,
  stats: { completedLessons: number; completionPercentage: number },
) {
  console.log(`[ACTION] markCourseCompleted called for course ${courseId}`, stats);
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    console.error("[ACTION] Unauthorized attempt to mark course completed");
    throw new Error("Unauthorized");
  }

  try {
    const certId = await createNextCertificateDomain().completions.upsertCourseCompletion(
      session.user.id,
      courseId,
      stats,
    );
    console.log(`[ACTION] Certificate issued successfully: ${certId}`);
    return certId;
  } catch (err) {
    console.error("[ACTION] Failed to issue certificate:", err);
    throw err;
  }
}
