import type {
  ExecutiveActionSeverity,
  ExecutiveActionStatus,
  ExecutivePageId,
  ExecutiveSectionState,
} from "./executive-types";
import type { ActionCenterUpdateInput } from "./executive-query.schemas";

export type ExecutiveActionEntityType =
  | "learner"
  | "course"
  | "lesson"
  | "inquiry"
  | "email_delivery"
  | "certificate"
  | "opportunity"
  | "ai_query"
  | "security_signal"
  | "data_freshness";

export type ActionCenterItem = {
  id: string;
  ruleId: string;
  sourceKey: string;
  severity: ExecutiveActionSeverity;
  sourcePage: ExecutivePageId;
  sourceSection: string;
  entityType: ExecutiveActionEntityType;
  entityId: string;
  title: string;
  recommendedAction: string;
  assignedOwnerId: string | null;
  dueAt: string | null;
  status: ExecutiveActionStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  dismissedAt: string | null;
  resolvedAt: string | null;
  reopenedCount: number;
  updatedAt: string;
  state: ExecutiveSectionState;
};

export type ActionCenterSeveritySummary = Record<ExecutiveActionSeverity, number>;

export type ActionCenterReadModel = {
  pageId: "action_center";
  query: unknown;
  generatedAt: string;
  sections: {
    actionItems: readonly ActionCenterItem[];
    severitySummary: ActionCenterSeveritySummary;
    salesSupportPipeline: readonly ActionCenterItem[];
    workloadByOwner: readonly {
      ownerId: string | null;
      openItems: number;
    }[];
  };
  freshnessSummary: {
    current: number;
    stale: number;
    very_stale: number;
    unavailable: number;
  };
  redactionNotes: readonly string[];
};

export type ActionCenterAuditActor = {
  userId: string;
  ipAddress?: string;
  userAgent?: string;
};

export interface ActionCenterRepository {
  listOpenItems(): Promise<readonly ActionCenterItem[]>;
  findBySourceKey(sourceKey: string): Promise<ActionCenterItem | null>;
  upsertDerivedItem(item: ActionCenterItem): Promise<ActionCenterItem>;
  updateWorkflowState(
    actor: ActionCenterAuditActor,
    itemId: string,
    input: ActionCenterUpdateInput,
  ): Promise<ActionCenterItem>;
}
