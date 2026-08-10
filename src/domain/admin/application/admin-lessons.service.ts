import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AdminSession, CreateLessonInput, UpdateLessonInput } from "@/domain/admin/contracts/admin-types";
import { CreateLessonSchema, UpdateLessonSchema, ReorderLessonsSchema } from "@/domain/admin/contracts/admin-validation.schemas";
import { AdminErrors } from "@/domain/admin/application/admin-errors";
import type { AuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";
import {
  invalidatePublicCourseDetailCache,
  invalidatePublicCourseListCache,
} from "@/domain/courses/application/course-cache";

export const createAdminLessonsService = (
  repo: AdminRepository,
  audit: AuditLogger,
) => ({
  async list(courseId: string) {
    return repo.listLessons(courseId);
  },

  async getById(id: string) {
    const lesson = await repo.getLesson(id);
    if (!lesson) throw AdminErrors.notFound("Lesson");
    return lesson;
  },

  async create(session: AdminSession, courseId: string, data: unknown) {
    const parsed = CreateLessonSchema.parse(data);
    const lesson = await repo.createLesson(courseId, parsed as CreateLessonInput);
    const course = await repo.getCourse(courseId);
    await invalidatePublicCourseListCache();
    await invalidatePublicCourseDetailCache({ courseId, slug: course?.slug });

    await audit.log({
      adminId: session.userId,
      action: "lesson.create",
      entityType: "lesson",
      entityId: lesson.id,
      after: { title: lesson.title, courseId },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return lesson;
  },

  async update(session: AdminSession, id: string, data: unknown) {
    const parsed = UpdateLessonSchema.parse(data);
    const existing = await repo.getLesson(id);
    if (!existing) throw AdminErrors.notFound("Lesson");

    const lesson = await repo.updateLesson(
      id,
      parsed as UpdateLessonInput,
      parsed.expectedVersion ? new Date(parsed.expectedVersion) : undefined,
    );
    const course = existing.courseId ? await repo.getCourse(existing.courseId) : null;
    await invalidatePublicCourseListCache();
    await invalidatePublicCourseDetailCache({
      courseId: existing.courseId,
      slug: course?.slug,
    });

    await audit.log({
      adminId: session.userId,
      action: "lesson.update",
      entityType: "lesson",
      entityId: id,
      before: { title: existing.title },
      after: { title: lesson?.title },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return lesson;
  },

  async toggleVisibility(session: AdminSession, id: string) {
    const existing = await repo.getLesson(id);
    if (!existing) throw AdminErrors.notFound("Lesson");

    const lesson = await repo.toggleLessonVisibility(id);
    const course = existing.courseId ? await repo.getCourse(existing.courseId) : null;
    await invalidatePublicCourseListCache();
    await invalidatePublicCourseDetailCache({
      courseId: existing.courseId,
      slug: course?.slug,
    });

    await audit.log({
      adminId: session.userId,
      action: "lesson.toggle_visibility",
      entityType: "lesson",
      entityId: id,
      before: { isPrivate: existing.isPrivate },
      after: { isPrivate: lesson?.isPrivate },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return lesson;
  },

  async archive(session: AdminSession, id: string) {
    const existing = await repo.getLesson(id);
    if (!existing) throw AdminErrors.notFound("Lesson");

    await repo.archiveLesson(id);
    const course = existing.courseId ? await repo.getCourse(existing.courseId) : null;
    await invalidatePublicCourseListCache();
    await invalidatePublicCourseDetailCache({
      courseId: existing.courseId,
      slug: course?.slug,
    });

    await audit.log({
      adminId: session.userId,
      action: "lesson.archive",
      entityType: "lesson",
      entityId: id,
      before: { title: existing.title },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });
  },

  async reorder(session: AdminSession, courseId: string, data: unknown) {
    const parsed = ReorderLessonsSchema.parse(data);
    const lessons = await repo.reorderLessons(courseId, parsed.lessonIds);
    const course = await repo.getCourse(courseId);
    await invalidatePublicCourseListCache();
    await invalidatePublicCourseDetailCache({ courseId, slug: course?.slug });

    await audit.log({
      adminId: session.userId,
      action: "lesson.reorder",
      entityType: "lesson",
      entityId: courseId,
      after: { lessonIds: parsed.lessonIds },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return lessons;
  },
});
