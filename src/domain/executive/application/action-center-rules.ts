import type {
  ActionCenterItem,
  ExecutiveActionEntityType,
} from "../contracts/action-center-repository.contract";
import type {
  ExecutiveActionSeverity,
  ExecutivePageId,
  ExecutiveSectionState,
} from "../contracts/executive-types";

export type ActionCenterRuleSignal = {
  ruleId: string;
  entityType: ExecutiveActionEntityType;
  entityId: string;
  title: string;
  recommendedAction: string;
  sourcePage: ExecutivePageId;
  sourceSection: string;
  severity: ExecutiveActionSeverity;
  dueAt?: Date | string | null;
  version?: string;
};

export type StalledLearnerSignalInput = {
  learnerId: string;
  learnerLabel: string;
  daysInactive: number;
};

export type FailedEmailSignalInput = {
  deliveryId: string;
  failureCategory: string | null;
  failedAt: Date | string;
};

export type OpportunityQualitySignalInput = {
  opportunityId: string;
  title: string;
  issueType: "expired" | "broken_link" | "missing_metadata" | "high_save_low_apply";
  severity?: ExecutiveActionSeverity;
};

export type InquirySlaSignalInput = {
  inquiryId: string;
  courseTitle: string;
  hoursSinceSubmission: number;
  nextFollowUpDueAt: Date | string;
};

const defaultState = (now: Date): ExecutiveSectionState => ({
  status: "ready",
  freshness: "current",
  lastSuccessfulAt: now.toISOString(),
});

export function sourceKeyFor(signal: ActionCenterRuleSignal): string {
  return `${signal.ruleId}:${signal.entityType}:${signal.entityId}:${signal.version ?? "v1"}`;
}

export function createActionCenterItem(
  signal: ActionCenterRuleSignal,
  now: Date = new Date(),
): ActionCenterItem {
  const isoNow = now.toISOString();
  return {
    id: crypto.randomUUID(),
    ruleId: signal.ruleId,
    sourceKey: sourceKeyFor(signal),
    severity: signal.severity,
    sourcePage: signal.sourcePage,
    sourceSection: signal.sourceSection,
    entityType: signal.entityType,
    entityId: signal.entityId,
    title: signal.title,
    recommendedAction: signal.recommendedAction,
    assignedOwnerId: null,
    dueAt: signal.dueAt ? new Date(signal.dueAt).toISOString() : null,
    status: "open",
    firstSeenAt: isoNow,
    lastSeenAt: isoNow,
    dismissedAt: null,
    resolvedAt: null,
    reopenedCount: 0,
    updatedAt: isoNow,
    state: defaultState(now),
  };
}

export class ActionCenterRules {
  stalledLearner(input: StalledLearnerSignalInput): ActionCenterRuleSignal | null {
    if (input.daysInactive < 14) return null;
    return {
      ruleId: "stalled-learner",
      entityType: "learner",
      entityId: input.learnerId,
      title: `${input.learnerLabel} is inactive`,
      recommendedAction: "Review the learner progress history and assign outreach.",
      sourcePage: "learner_progress",
      sourceSection: "stalledLearnerBreakdown",
      severity: input.daysInactive >= 30 ? "high" : "medium",
    };
  }

  failedEmail(input: FailedEmailSignalInput): ActionCenterRuleSignal {
    return {
      ruleId: "failed-email-delivery",
      entityType: "email_delivery",
      entityId: input.deliveryId,
      title: "Email delivery failed",
      recommendedAction: "Review provider failure category and retry or suppress safely.",
      sourcePage: "technical_health",
      sourceSection: "emailPipelineHealth",
      severity: input.failureCategory === "provider_unavailable" ? "high" : "medium",
      dueAt: input.failedAt,
    };
  }

  dataFreshnessFailure(input: {
    sectionId: string;
    sourceKey: string;
    status: "stale" | "very_stale" | "unavailable";
  }): ActionCenterRuleSignal {
    return {
      ruleId: "data-freshness-failure",
      entityType: "data_freshness",
      entityId: input.sectionId,
      title: `${input.sectionId} data is ${input.status.replace("_", " ")}`,
      recommendedAction: `Inspect ${input.sourceKey} source query and freshness logs.`,
      sourcePage: "technical_health",
      sourceSection: "freshnessGrid",
      severity: input.status === "unavailable" ? "critical" : "high",
    };
  }

  opportunityQuality(input: OpportunityQualitySignalInput): ActionCenterRuleSignal {
    const issueLabels = {
      expired: "is expired",
      broken_link: "has a broken link",
      missing_metadata: "is missing metadata",
      high_save_low_apply: "has saves but low apply intent",
    } as const;
    const recommendedActions = {
      expired: "Archive or refresh the opportunity deadline.",
      broken_link: "Verify and replace the application destination URL.",
      missing_metadata: "Complete required metadata before promoting the opportunity.",
      high_save_low_apply: "Review eligibility clarity, copy, and application friction.",
    } as const;

    return {
      ruleId: "opportunity-quality",
      entityType: "opportunity",
      entityId: input.opportunityId,
      title: `${input.title} ${issueLabels[input.issueType]}`,
      recommendedAction: recommendedActions[input.issueType],
      sourcePage: "opportunities_ai",
      sourceSection: "opportunityCleanupQueue",
      severity: input.severity ?? (input.issueType === "broken_link" || input.issueType === "expired" ? "high" : "medium"),
      version: input.issueType,
    };
  }

  inquirySlaBreach(input: InquirySlaSignalInput): ActionCenterRuleSignal {
    const severity = input.hoursSinceSubmission >= 96 ? "critical" : "high";
    return {
      ruleId: "inquiry-sla-breach",
      entityType: "inquiry",
      entityId: input.inquiryId,
      title: `${input.courseTitle} inquiry breached SLA`,
      recommendedAction: "Assign an owner and contact the learner before the lead goes cold.",
      sourcePage: "action_center",
      sourceSection: "salesSupportPipeline",
      severity,
      dueAt: input.nextFollowUpDueAt,
    };
  }
}

export function createActionCenterRules(): ActionCenterRules {
  return new ActionCenterRules();
}
