import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AdminSession, CreateCourseInput, UpdateCourseInput } from "@/domain/admin/contracts/admin-types";
import { CreateCourseSchema, CourseStatusSchema, EnrollUserSchema, UpdateCourseSchema } from "@/domain/admin/contracts/admin-validation.schemas";
import { AdminErrors } from "@/domain/admin/application/admin-errors";
import type { AuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";

export const createAdminCoursesService = (
  repo: AdminRepository,
  audit: AuditLogger,
) => ({
  async list(query: { page?: number; limit?: number; search?: string; status?: string; category?: string }) {
    return repo.listCourses(query);
  },

  async getById(id: string) {
    const course = await repo.getCourse(id);
    if (!course) throw AdminErrors.notFound("Course");
    return course;
  },

  async create(session: AdminSession, data: unknown) {
    const parsed = CreateCourseSchema.parse(data);
    const course = await repo.createCourse(parsed as CreateCourseInput);

    await audit.log({
      adminId: session.userId,
      action: "course.create",
      entityType: "course",
      entityId: course.id,
      after: { title: course.title, slug: course.slug },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return course;
  },

  async update(session: AdminSession, id: string, data: unknown) {
    const parsed = UpdateCourseSchema.parse(data);
    const existing = await repo.getCourse(id);
    if (!existing) throw AdminErrors.notFound("Course");

    const course = await repo.updateCourse(id, parsed as UpdateCourseInput, new Date(parsed.expectedVersion));

    await audit.log({
      adminId: session.userId,
      action: "course.update",
      entityType: "course",
      entityId: id,
      before: { title: existing.title, status: existing.status },
      after: { title: course?.title },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return course;
  },

  async updateStatus(session: AdminSession, id: string, data: unknown) {
    const parsed = CourseStatusSchema.parse(data);
    const existing = await repo.getCourse(id);
    if (!existing) throw AdminErrors.notFound("Course");

    const course = await repo.updateCourseStatus(id, parsed.status);

    await audit.log({
      adminId: session.userId,
      action: "course.update_status",
      entityType: "course",
      entityId: id,
      before: { status: existing.status },
      after: { status: parsed.status },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return course;
  },

  async archive(session: AdminSession, id: string) {
    const existing = await repo.getCourse(id);
    if (!existing) throw AdminErrors.notFound("Course");

    await repo.archiveCourse(id);

    await audit.log({
      adminId: session.userId,
      action: "course.archive",
      entityType: "course",
      entityId: id,
      before: { status: existing.status },
      after: { status: "archived" },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });
  },

  async enrollUser(session: AdminSession, courseId: string, data: unknown) {
    const parsed = EnrollUserSchema.parse(data);
    const course = await repo.getCourse(courseId);
    if (!course) throw AdminErrors.notFound("Course");

    await repo.enrollUser(courseId, parsed.email);

    await audit.log({
      adminId: session.userId,
      action: "course.enroll_user",
      entityType: "course",
      entityId: courseId,
      after: { email: parsed.email },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });
  },

  async revokeUser(session: AdminSession, courseId: string, data: unknown) {
    const parsed = EnrollUserSchema.parse(data);
    const course = await repo.getCourse(courseId);
    if (!course) throw AdminErrors.notFound("Course");

    await repo.revokeUser(courseId, parsed.email);

    await audit.log({
      adminId: session.userId,
      action: "course.revoke_user",
      entityType: "course",
      entityId: courseId,
      after: { email: parsed.email },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });
  },
});
