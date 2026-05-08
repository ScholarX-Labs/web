import { Course } from "@/types/course.types";
import { CourseListQuery, CourseSearchQuery } from "@/domain/courses/contracts";
import { PaginatedCoursesApiResponse } from "@/lib/api/courses.service";
import {
  FlatCourseRecord,
  NextCoursesRepository,
} from "@/domain/courses/infrastructure/db/next-courses.repository";
import { NextCourseError } from "@/domain/courses/application/next-course.errors";

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

    const sub = userId
      ? await this.repository.findActiveSubscription(userId, id)
      : null;

    return toCourse(course, Boolean(sub));
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

    const sub = userId
      ? await this.repository.findActiveSubscription(userId, course.id)
      : null;

    return toCourse(course, Boolean(sub));
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
}
