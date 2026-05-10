"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createNextCourseDomain } from "@/domain/courses";

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

    const domain = createNextCourseDomain();

    const completed = data.completed === true;
    const completedAt = data.completedAt ? new Date(data.completedAt) : null;
    if (completedAt && Number.isNaN(completedAt.getTime())) {
      return { success: false, error: "Invalid completedAt date" };
    }
    const watchedPercentage = Math.min(100, Math.max(0, data.watchedPercentage ?? 0));
    const lastPosition = Math.max(0, data.lastPosition ?? 0);

    await domain.catalog.syncProgress(
      session.user.id,
      lessonId,
      courseId,
      { completed, completedAt, watchedPercentage, lastPosition },
    );

    return { success: true };
  } catch (error) {
    console.error("[syncLessonProgress] error:", error);
    return { success: false, error: "Failed to sync progress" };
  }
}
