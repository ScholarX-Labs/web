import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import { getAdminStatsCacheKey, getCachedAdminValue, setCachedAdminStats } from "./admin-cache";

export const createAdminStatsService = (repo: AdminRepository) => ({
  async getOverview() {
    const cacheKey = getAdminStatsCacheKey();
    const cached = await getCachedAdminValue<Awaited<ReturnType<typeof repo.getOverviewStats>>>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await repo.getOverviewStats();
    await setCachedAdminStats(cacheKey, result);
    return result;
  },
});
