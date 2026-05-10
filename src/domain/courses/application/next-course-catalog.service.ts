/* eslint-disable @typescript-eslint/no-explicit-any */
import { Course, LessonSummary } from "@/types/course.types";
import { CourseListQuery, CourseSearchQuery } from "@/domain/courses/contracts";
import { PaginatedCoursesApiResponse } from "@/lib/api/courses.service";
import {
  FlatCourseRecord,
  NextCoursesRepository,
} from "@/domain/courses/infrastructure/db/next-courses.repository";
import { NextCourseError } from "@/domain/courses/application/next-course.errors";

const formatDuration = (seconds?: number | null): string => {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const parseNumber = (
  value: string | number | null | undefined,
): number | undefined => {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toCourse = (record: FlatCourseRecord, isSubscribed = false): Course => ({
  id: record.id,
  slug: record.slug ?? record.id,
  title: record.title,
  description: record.description,
  thumbnail: record.imageUrl ?? "",
  price: record.currentPrice,
  currentPrice: record.currentPrice,
  originalPrice: record.originalPrice ?? undefined,
  category: record.category,
  level:
    record.level === "Beginner" ||
    record.level === "Intermediate" ||
    record.level === "Advanced"
      ? record.level
      : undefined,
  duration: record.duration ?? undefined,
  videosCount: record.videosCount ?? undefined,
  lessonsCount: record.lessonsCount ?? undefined,
  studentsCount: record.studentsCount ?? undefined,
  rating: parseNumber(record.rating),
  totalRatings: record.totalRatings ?? undefined,
  isBestseller: record.isBestseller ?? undefined,
  urgencyText: record.urgencyText ?? undefined,
  tags: record.tags ?? undefined,
  videoPreviewUrl: record.videoPreviewUrl ?? undefined,
  instructor: record.instructor
    ? {
        id: record.instructor.id,
        name: record.instructor.name,
        avatar: record.instructor.avatar ?? undefined,
        title: record.instructor.title ?? undefined,
      }
    : undefined,
  requiresForm: Boolean(record.requiresForm),
  isPublished: record.status === "active",
  isSubscribed,
  createdAt: record.createdAt ?? new Date().toISOString(),
  updatedAt: record.updatedAt ?? new Date().toISOString(),
});

const toLessonSummary = (
  lesson: { id: string; title: string; videoUrl?: string | null; duration?: number | null; sortIndex: number },
  progress: { completed: boolean } | null,
  isSubscribed: boolean,
): LessonSummary => ({
  id: lesson.id,
  title: lesson.title,
  duration: formatDuration(lesson.duration),
  isCompleted: progress?.completed ?? false,
  isLocked: !isSubscribed,
  media: {
    src: lesson.videoUrl ?? "",
    poster: undefined,
  },
});

export class NextCourseCatalogService {
  constructor(private readonly repository: NextCoursesRepository) {}

  private toPagination(totalCourses: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalCourses / limit) || 1;

    return {
      currentPage: page,
      totalPages,
      totalCourses,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async list(
    query: CourseListQuery = {},
    userId?: string,
  ): Promise<PaginatedCoursesApiResponse> {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.max(query.limit ?? 3, 1);

    const result = await this.repository.listActive({
      page,
      limit,
      category: query.category,
    });

    const subscribedCourseIds = userId
      ? await this.repository.findActiveSubscriptionsByUser(
          userId,
          result.items.map((item) => item.id),
        )
      : new Set<string>();

    const mapped = result.items.map((item) =>
      toCourse(item, subscribedCourseIds.has(item.id)),
    );

    // Put enrolled courses first within the returned page
    mapped.sort((a, b) => {
      if (a.isSubscribed === b.isSubscribed) return 0;
      return a.isSubscribed ? -1 : 1;
    });

    return {
      items: mapped,
      pagination: this.toPagination(result.totalCourses, page, limit),
    };
  }

  getFeatured(query: CourseListQuery = {}, userId?: string) {
    return this.list({ ...query, category: "Featured" }, userId);
  }

  getScholarX(query: CourseListQuery = {}, userId?: string) {
    return this.list({ ...query, category: "ScholarX" }, userId);
  }

  search(query: CourseSearchQuery): Promise<PaginatedCoursesApiResponse> {
    if (!query.title?.trim()) {
      throw new NextCourseError(
        "BAD_REQUEST",
        400,
        "Search title is required",
        9005,
      );
    }

    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.max(query.limit ?? 3, 1);

    return this.repository
      .listActive({
        page,
        limit,
        searchTitle: query.title.trim(),
      })
      .then((result) => ({
        items: result.items.map((item) => toCourse(item, false)),
        pagination: this.toPagination(result.totalCourses, page, limit),
      }));
  }

  async getById(id: string, userId?: string): Promise<Course> {
    const course = await this.repository.findByIdActive(id);
    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `The requested course (ID: ${id}) was not found or is currently inactive.`,
        1001,
      );
    }

    const [sub, lessons] = await Promise.all([
      userId ? this.repository.findActiveSubscription(userId, id) : null,
      this.repository.listLessons(id),
    ]);

    const mapped = toCourse(course, Boolean(sub));
    mapped.lessons = lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description ?? undefined,
      content: l.content ?? undefined,
      videoUrl: l.videoUrl ?? undefined,
      duration: l.duration ?? undefined,
      order: l.sortIndex,
      courseId: l.courseId,
    }));

    return mapped;
  }

  async getBySlug(slug: string, userId?: string): Promise<Course> {
    const course = await this.repository.findBySlugActive(slug);
    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `Course with slug '${slug}' not found.`,
        1001,
      );
    }

    const [sub, lessons] = await Promise.all([
      userId ? this.repository.findActiveSubscription(userId, course.id) : null,
      this.repository.listLessons(course.id),
    ]);

    const mapped = toCourse(course, Boolean(sub));
    mapped.lessons = lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description ?? undefined,
      content: l.content ?? undefined,
      videoUrl: l.videoUrl ?? undefined,
      duration: l.duration ?? undefined,
      order: l.sortIndex,
      courseId: l.courseId,
    }));

    return mapped;
  }

  async getEnrollmentStatus(courseId: string, userId: string) {
    const course = await this.repository.findByIdActive(courseId);
    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        "Course not found.",
        1001,
      );
    }

    const sub = await this.repository.findActiveSubscription(userId, courseId);
    return {
      isSubscribed: Boolean(sub),
      courseId,
      userId,
    };
  }

  async getLesson(courseSlug: string, lessonId: string, userId?: string) {
    const course = await this.repository.findBySlugActive(courseSlug);
    if (!course) {
      throw new NextCourseError(
        "COURSE_NOT_FOUND",
        404,
        `Course with slug '${courseSlug}' not found.`,
        1001,
      );
    }

    const lessons = await this.repository.listLessons(course.id);

    // Resolve lessonId: try UUID match, then numeric index (raw or lesson-N prefix)
    const rawId = lessonId.startsWith("lesson-") ? lessonId.slice(7) : lessonId;
    let resolvedLesson = lessons.find((l: any) => l.id === lessonId);
    if (!resolvedLesson) {
      const numeric = parseInt(rawId, 10);
      if (!isNaN(numeric) && numeric >= 1 && numeric <= lessons.length) {
        resolvedLesson = lessons[numeric - 1];
      }
    }
    if (!resolvedLesson) {
      throw new NextCourseError(
        "LESSON_NOT_FOUND",
        404,
        `Lesson '${lessonId}' not found in course '${courseSlug}'.`,
        1003,
      );
    }

    const resolvedLessonId = resolvedLesson.id;

    const [sub, allProgress, lessonProgress] = await Promise.all([
      userId ? this.repository.findActiveSubscription(userId, course.id) : null,
      userId
        ? this.repository.findProgressByCourse(userId, course.id)
        : Promise.resolve([]),
      userId
        ? this.repository.findLessonProgress(userId, resolvedLessonId)
        : null,
    ]);

    const isSubscribed = Boolean(sub);
    const mappedCourse = toCourse(course, isSubscribed);
    mappedCourse.lessons = lessons.map((l: any) => ({
      id: l.id,
      title: l.title,
      description: l.description ?? undefined,
      content: l.content ?? undefined,
      videoUrl: l.videoUrl ?? undefined,
      duration: l.duration ?? undefined,
      order: l.sortIndex,
      courseId: l.courseId,
    }));

    const progressMap = new Map(allProgress.map((p: any) => [p.lessonId, p]));

    const allLessons: LessonSummary[] = lessons.map((l: any) =>
      toLessonSummary(l, progressMap.get(l.id) ?? null, isSubscribed),
    );

    const currentLesson = toLessonSummary(resolvedLesson, lessonProgress, isSubscribed);

    return {
      course: mappedCourse,
      currentLesson,
      allLessons,
    };
  }

  async syncProgress(
    userId: string,
    lessonId: string,
    courseId: string,
    data: {
      completed?: boolean;
      completedAt?: Date | null;
      watchedPercentage?: number;
      lastPosition?: number;
    },
  ) {
    await this.repository.upsertLessonProgress(userId, lessonId, courseId, data);
  }
}
