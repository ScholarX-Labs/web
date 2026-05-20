"use server";

import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createCourseProgressDomain, createNextCourseDomain } from "@/domain/courses";
import type {
  CertificateRecord,
  CourseProgressResult,
} from "@/domain/courses/contracts";
import { ROUTES } from "@/lib/routes";

const hashProgressPayload = (payload: unknown) =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");

let aggregateProgressSchemaAvailable = true;
let aggregateProgressSchemaWarningLogged = false;

const isSchemaNotReadyError = (error: unknown): boolean => {
  const cause = (error as { cause?: { code?: string } } | null)?.cause;
  const code = cause?.code ?? (error as { code?: string } | null)?.code;
  return code === "42P01" || code === "42703";
};

const syncLegacyLessonProgress = async (
  userId: string,
  lessonId: string,
  courseId: string,
  data: {
    completed: boolean;
    completedAt: Date | null;
    watchedPercentage: number;
    lastPosition: number;
  },
) => {
  const legacyDomain = createNextCourseDomain();
  await legacyDomain.catalog.syncProgress(userId, lessonId, courseId, data);
};

const warnAggregateSchemaUnavailable = () => {
  if (aggregateProgressSchemaWarningLogged) return;

  aggregateProgressSchemaWarningLogged = true;
  console.warn(
    "[syncLessonProgress] completion aggregate schema is unavailable; using lesson_progress fallback until the server restarts.",
  );
};

type SyncLessonProgressActionResult =
  | {
      success: true;
      progress?: CourseProgressResult;
      certificate?: CertificateRecord;
      certificateUrl?: string;
      certificateAlreadyIssued?: boolean;
      certificateError?: string;
    }
  | {
      success: false;
      error: string;
    };

const shouldIssueCertificate = (
  completed: boolean,
  progress: CourseProgressResult | undefined,
) =>
  completed &&
  progress?.course.status === "completed" &&
  Boolean(progress.course.completedAt) &&
  Boolean(progress.course.certificateEligibleAt);

export async function syncLessonProgress(
  lessonId: string,
  courseId: string,
  data: {
    completed?: boolean;
    completedAt?: string | null;
    watchedPercentage?: number;
    lastPosition?: number;
  },
): Promise<SyncLessonProgressActionResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const completed = data.completed === true;
    const completedAt = data.completedAt ? new Date(data.completedAt) : null;
    if (completedAt && Number.isNaN(completedAt.getTime())) {
      return { success: false, error: "Invalid completedAt date" };
    }
    const watchedPercentage = Math.min(
      100,
      Math.max(0, data.watchedPercentage ?? 0),
    );
    const lastPosition = Math.max(0, data.lastPosition ?? 0);

    if (!aggregateProgressSchemaAvailable) {
      await syncLegacyLessonProgress(session.user.id, lessonId, courseId, {
        completed,
        completedAt,
        watchedPercentage,
        lastPosition,
      });

      return { success: true };
    }

    let progressResult: CourseProgressResult | undefined;

    try {
      const domain = createCourseProgressDomain();
      const clientEventId = randomUUID();
      const eventType = completed ? "completion" : "heartbeat";
      const payload = {
        lessonId,
        courseId,
        completed,
        completedAt: completedAt?.toISOString() ?? null,
        watchedPercentage,
        lastPosition,
        eventType,
        clientEventId,
      };

      progressResult = await domain.progressCommand.syncLessonProgress({
        userId: session.user.id,
        lessonId,
        courseId,
        completed,
        completedAt,
        watchedPercentage,
        lastPosition,
        eventType,
        clientEventId,
        requestHash: hashProgressPayload(payload),
      });

      if (shouldIssueCertificate(completed, progressResult)) {
        try {
          const courseDomain = createNextCourseDomain();
          const course = await courseDomain.catalog.getById(
            courseId,
            session.user.id,
          );
          const certificateResult = await domain.certificate.issueCertificate({
            userId: session.user.id,
            courseId,
            learnerDisplayName:
              session.user.name ?? session.user.email ?? "ScholarX Learner",
            courseTitle: course.title,
            progress: progressResult.course,
          });

          return {
            success: true,
            progress: progressResult,
            certificate: certificateResult.certificate,
            certificateUrl: ROUTES.CERTIFICATE_DETAIL(
              certificateResult.certificate.certificateNumber,
            ),
            certificateAlreadyIssued: certificateResult.alreadyIssued,
          };
        } catch (certificateError) {
          console.error(
            "[syncLessonProgress] certificate issuance failed:",
            certificateError,
          );
          return {
            success: true,
            progress: progressResult,
            certificateError:
              "Course completed, but certificate generation failed. Please retry from your certificates page.",
          };
        }
      }
    } catch (error) {
      if (!isSchemaNotReadyError(error)) throw error;

      aggregateProgressSchemaAvailable = false;
      warnAggregateSchemaUnavailable();

      await syncLegacyLessonProgress(session.user.id, lessonId, courseId, {
        completed,
        completedAt,
        watchedPercentage,
        lastPosition,
      });
    }

    return { success: true, progress: progressResult };
  } catch (error) {
    console.error("[syncLessonProgress] error:", error);
    return { success: false, error: "Failed to sync progress" };
  }
}
