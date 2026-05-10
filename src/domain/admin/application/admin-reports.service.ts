import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import { ReportRangeSchema } from "@/domain/admin/contracts/admin-validation.schemas";

export const createAdminReportsService = (repo: AdminRepository) => ({
  async revenue(data: unknown) {
    const parsed = ReportRangeSchema.parse(data);
    return repo.getRevenueReport(new Date(parsed.from), new Date(parsed.to));
  },

  async users(data: unknown) {
    const parsed = ReportRangeSchema.parse(data);
    return repo.getUserReport(new Date(parsed.from), new Date(parsed.to));
  },

  async courses(data: unknown) {
    const parsed = ReportRangeSchema.parse(data);
    return repo.getCourseReport(new Date(parsed.from), new Date(parsed.to));
  },
});
