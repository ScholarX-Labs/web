import { TemporaryPasswordGenerator } from "@/lib/admin/temporary-password";
import { createAdminUser } from "@/lib/admin/create-admin-user";
import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AdminSession } from "@/domain/admin/contracts/admin-types";
import { CashEnrollmentSchema } from "@/domain/admin/contracts/admin-validation.schemas";
import { AdminErrors } from "@/domain/admin/application/admin-errors";
import type { AuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";
import { CourseCountersSyncService } from "@/domain/admin/application/course-counters-sync.service";

export const createAdminCashEnrollmentService = (
  repo: AdminRepository,
  audit: AuditLogger,
  counterSync: CourseCountersSyncService,
) => ({
  async execute(session: AdminSession, data: unknown) {
    const parsed = CashEnrollmentSchema.parse(data);

    let user = await repo.getUserByEmail(parsed.user.email);
    let password: string | undefined;

    if (!user) {
      password = TemporaryPasswordGenerator.generate();

      let created: { id: string; email: string };
      try {
        created = await createAdminUser({
          email: parsed.user.email,
          password,
          firstName: parsed.user.firstName,
          lastName: parsed.user.lastName,
          phoneNumber: parsed.user.phoneNumber,
          mustChangePassword: true,
        });
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        if (
          err?.code === "23505" || 
          err?.message?.includes("already exists") ||
          err?.message?.toLowerCase().includes("unique constraint")
        ) {
          throw AdminErrors.conflict("User with this email already exists");
        }
        throw error;
      }

      user = {
        id: created.id,
        email: created.email,
      };

      await audit.log({
        adminId: session.userId,
        action: "cash_enrollment.user.create",
        entityType: "user",
        entityId: user.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      });
    }

    const course = await repo.getCourse(parsed.course.courseId);
    if (!course) throw AdminErrors.notFound("Course");

    const enrollment = await repo.enrollUserWithPayment(
      parsed.course.courseId,
      user.id,
      parsed.course.amount,
      parsed.course.paymentMethod,
      parsed.course.paymentId,
    );

    // Sync students_count and all related caches after cash enrollment
    await counterSync.syncOnEnrollment(parsed.course.courseId, course.slug);

    await audit.log({
      adminId: session.userId,
      action: "cash_enrollment.enroll",
      entityType: "enrollment",
      entityId: enrollment.id,
      after: {
        courseId: parsed.course.courseId,
        userId: user.id,
        amount: parsed.course.amount,
        paymentMethod: parsed.course.paymentMethod,
      },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: parsed.user.firstName,
        lastName: parsed.user.lastName,
      },
      password,
      course: { id: course.id, title: course.title },
      enrollment: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        amount: enrollment.amount,
        paymentMethod: enrollment.paymentMethod,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
      },
    };
  },
});
