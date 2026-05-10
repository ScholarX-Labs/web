import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AdminSession, UpdateSubscriptionInput } from "@/domain/admin/contracts/admin-types";
import { UpdateSubscriptionSchema } from "@/domain/admin/contracts/admin-validation.schemas";
import { AdminErrors } from "@/domain/admin/application/admin-errors";
import type { AuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";

export const createAdminSubscriptionsService = (
  repo: AdminRepository,
  audit: AuditLogger,
) => ({
  async list(query: { page?: number; limit?: number; status?: string; courseId?: string }) {
    return repo.listSubscriptions(query);
  },

  async getById(id: string) {
    const sub = await repo.getSubscription(id);
    if (!sub) throw AdminErrors.notFound("Subscription");
    return sub;
  },

  async update(session: AdminSession, id: string, data: unknown) {
    const parsed = UpdateSubscriptionSchema.parse(data);
    const existing = await repo.getSubscription(id);
    if (!existing) throw AdminErrors.notFound("Subscription");

    const sub = await repo.updateSubscription(id, parsed as UpdateSubscriptionInput);

    await audit.log({
      adminId: session.userId,
      action: "subscription.update",
      entityType: "subscription",
      entityId: id,
      before: { status: existing.status, amount: existing.amount },
      after: { status: sub?.status, amount: sub?.amount },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return sub;
  },
});
