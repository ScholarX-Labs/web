"use server";

import { createHash, randomUUID } from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createCourseProgressDomain, createNextCourseDomain } from "@/domain/courses";

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

export async function syncLessonProgress(
  lessonId: string,
  courseId: string,
  data: {
    completed?: boolean;
    completedAt?: string | null;
    watchedPercentage?: number;
    lastPosition?: number;
  },
) {
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

      await domain.progressCommand.syncLessonProgress({
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

    return { success: true };
  } catch (error) {
    console.error("[syncLessonProgress] error:", error);
    return { success: false, error: "Failed to sync progress" };
  }
}
