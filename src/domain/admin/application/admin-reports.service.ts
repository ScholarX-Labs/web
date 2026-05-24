import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import { ReportRangeSchema } from "@/domain/admin/contracts/admin-validation.schemas";
import {
  getAdminReportCacheKey,
  getCachedAdminValue,
  setCachedAdminReport,
} from "./admin-cache";

export const createAdminReportsService = (repo: AdminRepository) => ({
  async revenue(data: unknown) {
    const parsed = ReportRangeSchema.parse(data);
    const cacheKey = getAdminReportCacheKey("revenue", parsed);
    const cached = await getCachedAdminValue<Awaited<ReturnType<typeof repo.getRevenueReport>>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await repo.getRevenueReport(new Date(parsed.from), new Date(parsed.to));
    await setCachedAdminReport(cacheKey, result);
    return result;
  },

  async users(data: unknown) {
    const parsed = ReportRangeSchema.parse(data);
    const cacheKey = getAdminReportCacheKey("users", parsed);
    const cached = await getCachedAdminValue<Awaited<ReturnType<typeof repo.getUserReport>>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await repo.getUserReport(new Date(parsed.from), new Date(parsed.to));
    await setCachedAdminReport(cacheKey, result);
    return result;
  },

  async courses(data: unknown) {
    const parsed = ReportRangeSchema.parse(data);
    const cacheKey = getAdminReportCacheKey("courses", parsed);
    const cached = await getCachedAdminValue<Awaited<ReturnType<typeof repo.getCourseReport>>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await repo.getCourseReport(new Date(parsed.from), new Date(parsed.to));
    await setCachedAdminReport(cacheKey, result);
    return result;
  },
});
