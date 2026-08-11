import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import {
  invalidatePublicCourseDetailCache,
  invalidatePublicCourseListCache,
  invalidateCourseMetricsCache,
} from "@/domain/courses/application/course-cache";
import { invalidateEnrollmentCache } from "@/domain/admin/application/admin-cache";

/**
 * CourseCountersSyncService
 *
 * Single Responsibility: Owns all logic for keeping denormalized counter
 * columns (`students_count`, `lessons_count`) in sync with their source of
 * truth, and for invalidating all relevant caches after each mutation.
 *
 * Design Principles:
 *  - Methods are named after the **business event** that triggers them, not
 *    the mechanism (e.g. `syncOnEnrollment` not `incrementStudentsCount`).
 *    This makes call-sites read as business intent, not implementation.
 *
 *  - Each method recomputes from the DB source of truth (not +/- 1) making
 *    it drift-proof and idempotent — calling it twice produces no error or
 *    double-counting.
 *
 *  - Each method handles both the DB counter update AND all cache
 *    invalidation in one call. Callers have zero cache responsibilities.
 *
 *  - Errors are never swallowed. If a sync fails (e.g. DB down), the error
 *    propagates to the caller so the admin is aware. The enrollment/lesson
 *    mutation already committed, but the counter drift is surfaced.
 *
 * Usage:
 *  - Inject once via the admin domain factory.
 *  - Call the appropriate `syncOn*` method at the end of every admin
 *    operation that mutates subscriptions or lessons.
 */
export class CourseCountersSyncService {
  constructor(private readonly repo: AdminRepository) {}

  /**
   * Call after an admin enrolls a user in a course.
   * Recomputes students_count from active subscriptions and invalidates all
   * course-related caches (public list, public detail, metrics, enrollment).
   */
  async syncOnEnrollment(courseId: string, slug?: string | null): Promise<void> {
    await this.repo.syncStudentsCount(courseId);
    await this._invalidateStudentCaches(courseId, slug);
  }

  /**
   * Call after an admin revokes a user from a course.
   * Recomputes students_count from active subscriptions and invalidates all
   * course-related caches.
   */
  async syncOnRevocation(courseId: string, slug?: string | null): Promise<void> {
    await this.repo.syncStudentsCount(courseId);
    await this._invalidateStudentCaches(courseId, slug);
  }

  /**
   * Call after an admin creates a new lesson in a course.
   * Recomputes lessons_count from non-archived lessons and invalidates the
   * public course detail and list caches.
   */
  async syncOnLessonCreated(courseId: string, slug?: string | null): Promise<void> {
    await this.repo.syncLessonsCount(courseId);
    await this._invalidateLessonCaches(courseId, slug);
  }

  /**
   * Call after an admin archives a lesson from a course.
   * Recomputes lessons_count from non-archived lessons and invalidates the
   * public course detail and list caches.
   */
  async syncOnLessonRemoved(courseId: string, slug?: string | null): Promise<void> {
    await this.repo.syncLessonsCount(courseId);
    await this._invalidateLessonCaches(courseId, slug);
  }

  private async _invalidateStudentCaches(courseId: string, slug?: string | null): Promise<void> {
    await Promise.all([
      invalidatePublicCourseListCache(),
      invalidatePublicCourseDetailCache({ courseId, slug }),
      invalidateCourseMetricsCache(courseId),
      invalidateEnrollmentCache(courseId),
    ]);
  }

  private async _invalidateLessonCaches(courseId: string, slug?: string | null): Promise<void> {
    await Promise.all([
      invalidatePublicCourseListCache(),
      invalidatePublicCourseDetailCache({ courseId, slug }),
      invalidateCourseMetricsCache(courseId),
    ]);
  }
}
