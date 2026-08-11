import { createAdminRepository } from "@/domain/admin/infrastructure/db/admin.repository";
import { createAuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";
import { createAdminCoursesService } from "@/domain/admin/application/admin-courses.service";
import { createAdminLessonsService } from "@/domain/admin/application/admin-lessons.service";
import { createAdminUsersService } from "@/domain/admin/application/admin-users.service";
import { createAdminSubscriptionsService } from "@/domain/admin/application/admin-subscriptions.service";
import { createAdminInquiriesService } from "@/domain/admin/application/admin-inquiries.service";
import { createAdminStatsService } from "@/domain/admin/application/admin-stats.service";
import { createAdminReportsService } from "@/domain/admin/application/admin-reports.service";
import { createAdminCashEnrollmentService } from "@/domain/admin/application/admin-cash-enrollment.service";
import { CourseCountersSyncService } from "@/domain/admin/application/course-counters-sync.service";

export const createAdminDomain = () => {
  const repo = createAdminRepository();
  const audit = createAuditLogger();

  // Single instance shared across all services that mutate subscriptions or
  // lessons. Centralises counter sync and cache invalidation responsibility.
  const counterSync = new CourseCountersSyncService(repo);

  return {
    courses: createAdminCoursesService(repo, audit, counterSync),
    lessons: createAdminLessonsService(repo, audit, counterSync),
    users: createAdminUsersService(repo, audit),
    subscriptions: createAdminSubscriptionsService(repo, audit),
    inquiries: createAdminInquiriesService(repo, audit),
    stats: createAdminStatsService(repo),
    reports: createAdminReportsService(repo),
    cashEnrollment: createAdminCashEnrollmentService(repo, audit, counterSync),
  };
};

export type AdminDomain = ReturnType<typeof createAdminDomain>;
