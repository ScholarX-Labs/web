import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLog } from "@/db/schema/admin-db.schema";
import { dbCourses, dbInquiries } from "@/db/schema/courses-db.schema";
import { dbExecutiveActionItemStates } from "@/db/schema/executive-analytics.schema";
import {
  createActionCenterItem,
  createActionCenterRules,
} from "@/domain/executive/application/action-center-rules";
import type {
  ActionCenterAuditActor,
  ActionCenterItem,
  ActionCenterRepository,
} from "@/domain/executive/contracts/action-center-repository.contract";
import type { ActionCenterUpdateInput } from "@/domain/executive/contracts/executive-query.schemas";
import type {
  ExecutiveActionSeverity,
  ExecutiveActionStatus,
  ExecutivePageId,
} from "@/domain/executive/contracts/executive-types";

type ActionItemRow = typeof dbExecutiveActionItemStates.$inferSelect;

const defaultState = {
  status: "ready",
  freshness: "current",
  lastSuccessfulAt: null,
} as const;

function toIso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function toActionCenterItem(row: ActionItemRow): ActionCenterItem {
  return {
    id: row.id,
    ruleId: row.ruleId,
    sourceKey: row.sourceKey,
    severity: row.severity as ExecutiveActionSeverity,
    sourcePage: row.sourcePage as ExecutivePageId,
    sourceSection: row.sourceSection,
    entityType: row.entityType as ActionCenterItem["entityType"],
    entityId: row.entityId,
    title: row.sourceKey,
    recommendedAction: "",
    assignedOwnerId: row.assignedOwnerId,
    dueAt: toIso(row.dueAt),
    status: row.status as ExecutiveActionStatus,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    dismissedAt: toIso(row.dismissedAt),
    resolvedAt: toIso(row.resolvedAt),
    reopenedCount: row.reopenedCount,
    updatedAt: row.updatedAt.toISOString(),
    state: defaultState,
  };
}

const validTransitions = {
  open: ["in_progress", "dismissed", "escalated"],
  in_progress: ["resolved", "escalated"],
  escalated: ["in_progress", "resolved"],
  resolved: [],
  dismissed: [],
} satisfies Record<ExecutiveActionStatus, readonly ExecutiveActionStatus[]>;

function assertValidTransition(
  current: ExecutiveActionStatus,
  next: ExecutiveActionStatus,
) {
  if (current === next) return;
  if (!(validTransitions[current] as readonly ExecutiveActionStatus[]).includes(next)) {
    throw new Error(`Invalid Action Center transition: ${current} -> ${next}`);
  }
}

export class DrizzleActionCenterRepository implements ActionCenterRepository {
  async listOpenItems(): Promise<readonly ActionCenterItem[]> {
    const rows = await db
      .select()
      .from(dbExecutiveActionItemStates)
      .where(
        inArray(dbExecutiveActionItemStates.status, [
          "open",
          "in_progress",
          "escalated",
        ]),
      );
    const storedItems = rows.map(toActionCenterItem);
    const storedSourceKeys = new Set(storedItems.map((item) => item.sourceKey));
    const inquiryItems = (await this.listInquirySlaBreachItems()).filter(
      (item) => !storedSourceKeys.has(item.sourceKey),
    );
    return [...storedItems, ...inquiryItems];
  }

  private async listInquirySlaBreachItems(): Promise<readonly ActionCenterItem[]> {
    const now = new Date();
    const slaHours = 48;
    const slaCutoff = new Date(now.getTime() - slaHours * 3_600_000);
    const rows = await db
      .select({
        inquiryId: dbInquiries.id,
        courseTitle: dbCourses.title,
        createdAt: dbInquiries.createdAt,
      })
      .from(dbInquiries)
      .innerJoin(dbCourses, eq(dbCourses.id, dbInquiries.courseId))
      .where(
        and(
          eq(dbInquiries.status, "pending"),
          sql`${dbInquiries.createdAt} is not null`,
          sql`${dbInquiries.createdAt} <= ${slaCutoff}`,
        ),
      )
      .limit(100);

    const rules = createActionCenterRules();
    return rows.map((row) => {
      const createdAt = row.createdAt ?? now;
      const hoursSinceSubmission = Math.max(
        0,
        Math.round((now.getTime() - createdAt.getTime()) / 3_600_000),
      );
      const nextFollowUpDueAt = new Date(createdAt.getTime() + slaHours * 3_600_000);
      return createActionCenterItem(
        rules.inquirySlaBreach({
          inquiryId: row.inquiryId,
          courseTitle: row.courseTitle,
          hoursSinceSubmission,
          nextFollowUpDueAt,
        }),
        now,
      );
    });
  }

  async findBySourceKey(sourceKey: string): Promise<ActionCenterItem | null> {
    const rows = await db
      .select()
      .from(dbExecutiveActionItemStates)
      .where(eq(dbExecutiveActionItemStates.sourceKey, sourceKey))
      .limit(1);
    return rows[0] ? toActionCenterItem(rows[0]) : null;
  }

  async upsertDerivedItem(item: ActionCenterItem): Promise<ActionCenterItem> {
    const now = new Date();
    const reopenedStatusCase = sql`
      case
        when ${dbExecutiveActionItemStates.status} = 'dismissed' then 'open'
        when ${dbExecutiveActionItemStates.status} = 'resolved'
          and ${dbExecutiveActionItemStates.resolvedAt} > ${new Date(now.getTime() - 30 * 86_400_000)}
          then 'open'
        else ${dbExecutiveActionItemStates.status}
      end
    `;
    const rows = await db
      .insert(dbExecutiveActionItemStates)
      .values({
        id: item.id,
        ruleId: item.ruleId,
        sourceKey: item.sourceKey,
        severity: item.severity,
        sourcePage: item.sourcePage,
        sourceSection: item.sourceSection,
        entityType: item.entityType,
        entityId: item.entityId,
        assignedOwnerId: item.assignedOwnerId,
        status: item.status,
        dueAt: item.dueAt ? new Date(item.dueAt) : null,
        resolutionNote: null,
        firstSeenAt: new Date(item.firstSeenAt),
        lastSeenAt: new Date(item.lastSeenAt),
        dismissedAt: item.dismissedAt ? new Date(item.dismissedAt) : null,
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : null,
        reopenedCount: item.reopenedCount,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: dbExecutiveActionItemStates.sourceKey,
        set: {
          severity: item.severity,
          lastSeenAt: new Date(item.lastSeenAt),
          status: reopenedStatusCase,
          dismissedAt: sql`
            case
              when ${dbExecutiveActionItemStates.status} = 'dismissed' then null
              else ${dbExecutiveActionItemStates.dismissedAt}
            end
          `,
          reopenedCount: sql`
            case
              when ${dbExecutiveActionItemStates.status} in ('dismissed', 'resolved')
                and ${reopenedStatusCase} = 'open'
                then ${dbExecutiveActionItemStates.reopenedCount} + 1
              else ${dbExecutiveActionItemStates.reopenedCount}
            end
          `,
          resolvedAt: sql`
            case
              when ${reopenedStatusCase} = 'open' then null
              else ${dbExecutiveActionItemStates.resolvedAt}
            end
          `,
          updatedAt: now,
        },
      })
      .returning();
    return toActionCenterItem(rows[0]);
  }

  async updateWorkflowState(
    actor: ActionCenterAuditActor,
    itemId: string,
    input: ActionCenterUpdateInput,
  ): Promise<ActionCenterItem> {
    const now = new Date();
    return db.transaction(async (tx) => {
      const existingRows = await tx
        .select()
        .from(dbExecutiveActionItemStates)
        .where(eq(dbExecutiveActionItemStates.id, itemId))
        .limit(1);
      const existing = existingRows[0];
      if (!existing) {
        throw new Error(`Action Center item ${itemId} not found`);
      }
      if (input.status !== undefined) {
        assertValidTransition(
          existing.status as ExecutiveActionStatus,
          input.status,
        );
      }

      const rows = await tx
        .update(dbExecutiveActionItemStates)
        .set({
          ...(input.status !== undefined && { status: input.status }),
          ...(input.assignedOwnerId !== undefined && {
            assignedOwnerId: input.assignedOwnerId,
          }),
          ...(input.dueAt !== undefined && {
            dueAt: input.dueAt ? new Date(input.dueAt) : null,
          }),
          ...(input.resolutionNote !== undefined && {
            resolutionNote: input.resolutionNote,
          }),
          ...(input.status === "dismissed" && { dismissedAt: now, resolvedAt: null }),
          ...(input.status === "resolved" && { resolvedAt: now, dismissedAt: null }),
          updatedAt: now,
        })
        .where(eq(dbExecutiveActionItemStates.id, itemId))
        .returning();

      await tx.insert(adminAuditLog).values({
        adminId: actor.userId,
        action:
          input.status !== undefined
            ? "executive.action_item.status_changed"
            : "executive.action_item.updated",
        entityType: "action_item",
        entityId: itemId,
        before: {
          status: existing.status,
          assignedOwnerId: existing.assignedOwnerId,
          dueAt: existing.dueAt?.toISOString() ?? null,
        },
        after: {
          status: rows[0].status,
          assignedOwnerId: rows[0].assignedOwnerId,
          dueAt: rows[0].dueAt?.toISOString() ?? null,
          resolutionNote: rows[0].resolutionNote ?? null,
        },
        ipAddress: actor.ipAddress ?? null,
        userAgent: actor.userAgent ?? null,
      });

      return toActionCenterItem(rows[0]);
    });
  }
}

export function createActionCenterRepository(): ActionCenterRepository {
  return new DrizzleActionCenterRepository();
}
