import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";

export const createAdminStatsService = (repo: AdminRepository) => ({
  async getOverview() {
    return repo.getOverviewStats();
  },
});
