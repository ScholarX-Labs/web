export const PUBLIC_LESSON_STATUSES = ["active", "published"] as const;

export const isPublicLessonStatus = (status: string) =>
  (PUBLIC_LESSON_STATUSES as readonly string[]).includes(status);
