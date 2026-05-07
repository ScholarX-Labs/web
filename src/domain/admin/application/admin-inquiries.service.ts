import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AdminSession } from "@/domain/admin/contracts/admin-types";
import { UpdateInquiryStatusSchema } from "@/domain/admin/contracts/admin-validation.schemas";
import { AdminErrors } from "@/domain/admin/application/admin-errors";
import type { AuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";

export const createAdminInquiriesService = (
  repo: AdminRepository,
  audit: AuditLogger,
) => ({
  async list(query: { page?: number; limit?: number; status?: string; search?: string }) {
    return repo.listInquiries(query);
  },

  async getById(id: string) {
    const inquiry = await repo.getInquiry(id);
    if (!inquiry) throw AdminErrors.notFound("Inquiry");
    return inquiry;
  },

  async updateStatus(session: AdminSession, id: string, data: unknown) {
    const parsed = UpdateInquiryStatusSchema.parse(data);
    const existing = await repo.getInquiry(id);
    if (!existing) throw AdminErrors.notFound("Inquiry");

    const inquiry = await repo.updateInquiryStatus(id, parsed.status);

    await audit.log({
      adminId: session.userId,
      action: "inquiry.update_status",
      entityType: "inquiry",
      entityId: id,
      before: { status: existing.status },
      after: { status: parsed.status },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return inquiry;
  },
});
