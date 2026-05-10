import { createAdminRepository } from "@/domain/admin/infrastructure/db/admin.repository";
import { createAuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";
import { createAdminCoursesService } from "@/domain/admin/application/admin-courses.service";
import { createAdminLessonsService } from "@/domain/admin/application/admin-lessons.service";
import { createAdminUsersService } from "@/domain/admin/application/admin-users.service";
import { createAdminSubscriptionsService } from "@/domain/admin/application/admin-subscriptions.service";
import { createAdminInquiriesService } from "@/domain/admin/application/admin-inquiries.service";
import { createAdminStatsService } from "@/domain/admin/application/admin-stats.service";
import { createAdminReportsService } from "@/domain/admin/application/admin-reports.service";

export const createAdminDomain = () => {
  const repo = createAdminRepository();
  const audit = createAuditLogger();

  return {
    courses: createAdminCoursesService(repo, audit),
    lessons: createAdminLessonsService(repo, audit),
    users: createAdminUsersService(repo, audit),
    subscriptions: createAdminSubscriptionsService(repo, audit),
    inquiries: createAdminInquiriesService(repo, audit),
    stats: createAdminStatsService(repo),
    reports: createAdminReportsService(repo),
  };
};

export type AdminDomain = ReturnType<typeof createAdminDomain>;
