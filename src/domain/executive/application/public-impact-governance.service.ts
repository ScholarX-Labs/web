import type { PublicImpactApprovalStatus } from "@/db/schema/executive-analytics.schema";
import type {
  PublicImpactProposalInput,
  PublicImpactReviewInput,
} from "../contracts/executive-query.schemas";
import type {
  PublicImpactAuditEntry,
  PublicImpactMetricGovernanceRow,
} from "../contracts/executive-read-repository.contract";

export type PublicImpactMetricDraft = {
  metricId: string;
  label: string;
  computedValue: number;
  manualOverrideValue: number | null;
  sourceDescription: string;
  ownerId: string;
  approvalStatus: PublicImpactApprovalStatus;
  proposedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | string | null;
  rejectedBy: string | null;
  rejectedAt: Date | string | null;
  rejectionReason: string | null;
  auditTrail: readonly PublicImpactAuditEntry[];
  autoPublish: boolean;
  freshnessAt: Date | string;
  updatedAt: Date | string;
};

export interface PublicImpactGovernanceRepository {
  listMetrics(): Promise<readonly PublicImpactMetricGovernanceRow[]>;
  findMetric(metricId: string): Promise<PublicImpactMetricDraft | null>;
  upsertProposal(
    input: PublicImpactMetricDraft,
  ): Promise<PublicImpactMetricGovernanceRow>;
  updateReview(
    metricId: string,
    input: Partial<PublicImpactMetricDraft>,
  ): Promise<PublicImpactMetricGovernanceRow | null>;
}

const allowedTransitions = {
  draft: ["pending_review", "manual_override"],
  pending_review: ["approved", "rejected", "expired", "manual_override"],
  approved: ["published", "manual_override"],
  published: ["manual_override"],
  rejected: ["draft", "manual_override"],
  expired: ["draft", "manual_override"],
  manual_override: ["pending_review", "approved", "published"],
} as const satisfies Record<PublicImpactApprovalStatus, readonly PublicImpactApprovalStatus[]>;

function titleFromMetricId(metricId: string): string {
  return metricId
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function assertTransition(
  from: PublicImpactApprovalStatus,
  to: PublicImpactApprovalStatus,
) {
  if (from === to) return;
  if (!(allowedTransitions[from] as readonly PublicImpactApprovalStatus[]).includes(to)) {
    throw new Error(`Invalid public impact transition: ${from} -> ${to}`);
  }
}

function auditEntry(input: {
  action: string;
  actorId: string;
  at: Date;
  fromStatus: PublicImpactApprovalStatus | null;
  toStatus: PublicImpactApprovalStatus;
  reason: string | null;
  originalComputedValue: number | null;
  manualOverrideValue: number | null;
}): PublicImpactAuditEntry {
  return {
    action: input.action,
    actorId: input.actorId,
    at: input.at.toISOString(),
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    reason: input.reason,
    originalComputedValue: input.originalComputedValue,
    manualOverrideValue: input.manualOverrideValue,
  };
}

export class PublicImpactGovernanceService {
  constructor(private readonly repository: PublicImpactGovernanceRepository) {}

  listMetrics(): Promise<readonly PublicImpactMetricGovernanceRow[]> {
    return this.repository.listMetrics();
  }

  async proposeMetric(
    actorId: string,
    input: PublicImpactProposalInput,
    now = new Date(),
  ): Promise<PublicImpactMetricGovernanceRow> {
    const existing = await this.repository.findMetric(input.metricId);
    const targetStatus: PublicImpactApprovalStatus =
      input.manualOverrideValue === null || input.manualOverrideValue === undefined
        ? "pending_review"
        : "manual_override";

    if (existing) {
      assertTransition(existing.approvalStatus, targetStatus);
    }

    const trail = [
      ...(existing?.auditTrail ?? []),
      auditEntry({
        action: targetStatus === "manual_override" ? "manual_override" : "propose",
        actorId,
        at: now,
        fromStatus: existing?.approvalStatus ?? null,
        toStatus: targetStatus,
        reason: input.rationale,
        originalComputedValue: existing?.computedValue ?? null,
        manualOverrideValue: input.manualOverrideValue ?? null,
      }),
    ];

    return this.repository.upsertProposal({
      metricId: input.metricId,
      label: existing?.label ?? titleFromMetricId(input.metricId),
      computedValue: input.computedValue,
      manualOverrideValue: input.manualOverrideValue ?? null,
      sourceDescription: input.sourceDescription,
      ownerId: input.ownerId,
      approvalStatus: targetStatus,
      proposedBy: actorId,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      auditTrail: trail,
      autoPublish: existing?.autoPublish ?? false,
      freshnessAt: now,
      updatedAt: now,
    });
  }

  async reviewMetric(
    actorId: string,
    metricId: string,
    input: PublicImpactReviewInput,
    now = new Date(),
  ): Promise<PublicImpactMetricGovernanceRow> {
    const existing = await this.repository.findMetric(metricId);
    if (!existing) {
      throw new Error("Public impact metric not found");
    }
    assertTransition(existing.approvalStatus, input.status);

    if (input.status === "approved" && existing.proposedBy === actorId) {
      throw new Error("Public impact proposer cannot approve their own metric");
    }
    if (input.status === "rejected" && !input.reason) {
      throw new Error("Rejecting a public impact metric requires a reason");
    }

    const trail = [
      ...existing.auditTrail,
      auditEntry({
        action: input.status,
        actorId,
        at: now,
        fromStatus: existing.approvalStatus,
        toStatus: input.status,
        reason: input.reason ?? null,
        originalComputedValue: existing.computedValue,
        manualOverrideValue: existing.manualOverrideValue,
      }),
    ];

    const updated = await this.repository.updateReview(metricId, {
      approvalStatus: input.status,
      approvedBy: input.status === "approved" ? actorId : null,
      approvedAt: input.status === "approved" ? now : null,
      rejectedBy: input.status === "rejected" ? actorId : null,
      rejectedAt: input.status === "rejected" ? now : null,
      rejectionReason: input.status === "rejected" ? input.reason ?? null : null,
      auditTrail: trail,
      updatedAt: now,
    });
    if (!updated) {
      throw new Error("Public impact metric not found");
    }
    return updated;
  }
}

export function createPublicImpactGovernanceService(
  repository: PublicImpactGovernanceRepository,
) {
  return new PublicImpactGovernanceService(repository);
}
