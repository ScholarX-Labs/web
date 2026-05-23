"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createCertificateDomain } from "@/domain/certificates/factory/certificate-services.factory";
import type { LearnerCertificateLinkDto } from "@/domain/certificates/application/certificate-verification-query.service";

export type GetLearnerCertificatesResult =
  | { success: true; data: LearnerCertificateLinkDto[] }
  | { success: false; error: string };

export async function getLearnerCertificates(): Promise<GetLearnerCertificatesResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const certDomain = createCertificateDomain();
    const certificates = await certDomain.verificationQuery.getCertificatesForUser(
      session.user.id,
    );

    return { success: true, data: certificates };
  } catch (error) {
    console.error("[getLearnerCertificates] error:", error);
    return { success: false, error: "Failed to fetch certificates" };
  }
}
