import type {
  ActionCenterItem,
  ActionCenterReadModel,
  ActionCenterRepository,
  ActionCenterSeveritySummary,
} from "../contracts/action-center-repository.contract";
import type { ExecutivePageQuery } from "../contracts/executive-query.schemas";
import type { ExecutiveActionSeverity } from "../contracts/executive-types";

const severityRank: Record<ExecutiveActionSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export class ActionCenterService {
  constructor(private readonly repository: ActionCenterRepository) {}

  sortItems(items: readonly ActionCenterItem[]): ActionCenterItem[] {
    return [...items].sort((a, b) => {
      const severity = severityRank[a.severity] - severityRank[b.severity];
      if (severity !== 0) return severity;
      const assignment = Number(Boolean(a.assignedOwnerId)) - Number(Boolean(b.assignedOwnerId));
      if (assignment !== 0) return assignment;
      const dueA = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      const dueB = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (dueA !== dueB) return dueA - dueB;
      return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
    });
  }

  summarize(items: readonly ActionCenterItem[]): ActionCenterSeveritySummary {
    return items.reduce(
      (summary, item) => {
        summary[item.severity] += 1;
        return summary;
      },
      { critical: 0, high: 0, medium: 0, low: 0 } satisfies ActionCenterSeveritySummary,
    );
  }

  workloadByOwner(items: readonly ActionCenterItem[]) {
    const counts = new Map<string | null, number>();
    for (const item of items) {
      counts.set(item.assignedOwnerId, (counts.get(item.assignedOwnerId) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([ownerId, openItems]) => ({ ownerId, openItems }))
      .sort((a, b) => b.openItems - a.openItems);
  }

  async getActionCenter(query: ExecutivePageQuery): Promise<ActionCenterReadModel> {
    const items = this.sortItems(await this.repository.listOpenItems());
    return {
      pageId: "action_center",
      query,
      generatedAt: new Date().toISOString(),
      sections: {
        actionItems: items,
        severitySummary: this.summarize(items),
        salesSupportPipeline: items.filter((item) => item.entityType === "inquiry"),
        workloadByOwner: this.workloadByOwner(items),
      },
      freshnessSummary: {
        current: 1,
        stale: 0,
        very_stale: 0,
        unavailable: 0,
      },
      redactionNotes: [],
    };
  }
}

export function createActionCenterService(repository: ActionCenterRepository) {
  return new ActionCenterService(repository);
}
