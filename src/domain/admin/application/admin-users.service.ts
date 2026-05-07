import type { AdminRepository } from "@/domain/admin/contracts/admin-repository.contract";
import type { AdminSession, UpdateUserInput } from "@/domain/admin/contracts/admin-types";
import { UpdateUserSchema, UpdateUserRoleSchema, BlockUserSchema } from "@/domain/admin/contracts/admin-validation.schemas";
import { AdminErrors } from "@/domain/admin/application/admin-errors";
import type { AuditLogger } from "@/domain/admin/infrastructure/audit/audit-logger";

export const createAdminUsersService = (
  repo: AdminRepository,
  audit: AuditLogger,
) => ({
  async list(query: { page?: number; limit?: number; search?: string; role?: string; isBlocked?: boolean }) {
    return repo.listUsers(query);
  },

  async getById(id: string) {
    const user = await repo.getUser(id);
    if (!user) throw AdminErrors.notFound("User");
    return user;
  },

  async update(session: AdminSession, id: string, data: unknown) {
    const parsed = UpdateUserSchema.parse(data);
    const existing = await repo.getUser(id);
    if (!existing) throw AdminErrors.notFound("User");

    const user = await repo.updateUser(id, parsed as UpdateUserInput);

    await audit.log({
      adminId: session.userId,
      action: "user.update",
      entityType: "user",
      entityId: id,
      before: { firstName: existing.firstName, lastName: existing.lastName },
      after: { firstName: user?.firstName, lastName: user?.lastName },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return user;
  },

  async setRole(session: AdminSession, id: string, data: unknown) {
    const parsed = UpdateUserRoleSchema.parse(data);

    if (id === session.userId) {
      throw AdminErrors.validation({ message: "Admin cannot change their own role" });
    }

    const existing = await repo.getUser(id);
    if (!existing) throw AdminErrors.notFound("User");

    const user = await repo.setUserRole(id, parsed.role);

    await audit.log({
      adminId: session.userId,
      action: "user.role.update",
      entityType: "user",
      entityId: id,
      before: { role: existing.role },
      after: { role: parsed.role },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return user;
  },

  async block(session: AdminSession, id: string, data: unknown) {
    const parsed = BlockUserSchema.parse(data);

    if (id === session.userId) {
      throw AdminErrors.validation({ message: "Admin cannot block themselves" });
    }

    const existing = await repo.getUser(id);
    if (!existing) throw AdminErrors.notFound("User");

    const user = await repo.blockUser(id, parsed.reason);

    await audit.log({
      adminId: session.userId,
      action: "user.block",
      entityType: "user",
      entityId: id,
      before: { banned: existing.banned },
      after: { banned: true, reason: parsed.reason },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return user;
  },

  async unblock(session: AdminSession, id: string) {
    const existing = await repo.getUser(id);
    if (!existing) throw AdminErrors.notFound("User");

    const user = await repo.unblockUser(id);

    await audit.log({
      adminId: session.userId,
      action: "user.unblock",
      entityType: "user",
      entityId: id,
      before: { banned: existing.banned },
      after: { banned: false },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });

    return user;
  },

  async suspend(session: AdminSession, id: string) {
    if (id === session.userId) {
      throw AdminErrors.validation({ message: "Admin cannot suspend themselves" });
    }

    const existing = await repo.getUser(id);
    if (!existing) throw AdminErrors.notFound("User");

    await repo.suspendUser(id);

    await audit.log({
      adminId: session.userId,
      action: "user.suspend",
      entityType: "user",
      entityId: id,
      before: { banned: existing.banned },
      after: { banned: true, reason: "Account suspended by admin" },
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    });
  },
});
