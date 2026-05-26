import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createExecutiveRouteHandlers } from "../route-handlers";
import type { ExecutiveDomain } from "@/domain/executive";
import type { ActionCenterItem } from "@/domain/executive/contracts/action-center-repository.contract";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";

const enabledFlags: ExecutiveFeatureFlags = {
  EXECUTIVE_DASHBOARD_ENABLED: true,
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: false,
  EXECUTIVE_FINANCE_ENABLED: false,
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: true,
  EXECUTIVE_AI_HEATMAP_ENABLED: false,
};

const baseItem: ActionCenterItem = {
  id: "item-1",
  ruleId: "failed-email-delivery",
  sourceKey: "failed-email-delivery:email_delivery:delivery-1:v1",
  severity: "high",
  sourcePage: "technical_health",
  sourceSection: "emailPipelineHealth",
  entityType: "email_delivery",
  entityId: "delivery-1",
  title: "Email delivery failed",
  recommendedAction: "Review provider state.",
  assignedOwnerId: null,
  dueAt: null,
  status: "open",
  firstSeenAt: "2026-05-25T12:00:00.000Z",
  lastSeenAt: "2026-05-25T12:00:00.000Z",
  dismissedAt: null,
  resolvedAt: null,
  reopenedCount: 0,
  updatedAt: "2026-05-25T12:00:00.000Z",
  state: {
    status: "ready",
    freshness: "current",
    lastSuccessfulAt: "2026-05-25T12:00:00.000Z",
  },
};

function makeActionCenterDomain(): ExecutiveDomain {
  return {
    repositories: {
      read: {
        getOverview: async () => {
          throw new Error("not used");
        },
        getUsers: async () => {
          throw new Error("not used");
        },
        getCoursesLessons: async () => {
          throw new Error("not used");
        },
        getLessonDrilldown: async () => {
          throw new Error("not used");
        },
        getLearnerProgress: async () => {
          throw new Error("not used");
        },
        getOpportunitiesAi: async () => {
          throw new Error("not used");
        },
        getTechnicalHealth: async () => {
          throw new Error("not used");
        },
        getPublicGrowth: async () => {
          throw new Error("not used");
        },
        getTeamOperations: async () => {
          throw new Error("not used");
        },
        getFinance: async () => {
          throw new Error("not used");
        },
      },
      actionCenter: {
        listOpenItems: async () => [baseItem],
        findBySourceKey: async () => baseItem,
        upsertDerivedItem: async (item) => item,
        updateWorkflowState: async (_actor, itemId, input) => ({
          ...baseItem,
          id: itemId,
          status: input.status ?? baseItem.status,
          assignedOwnerId:
            input.assignedOwnerId === undefined
              ? baseItem.assignedOwnerId
              : input.assignedOwnerId,
          updatedAt: "2026-05-25T12:05:00.000Z",
        }),
      },
      analyticsEvents: {
        record: async () => "event-1",
      },
    },
    policies: {
      calculations: {} as ExecutiveDomain["policies"]["calculations"],
      redaction: {} as ExecutiveDomain["policies"]["redaction"],
    },
    services: {
      freshness: {} as ExecutiveDomain["services"]["freshness"],
    },
    mappers: {
      charts: {} as ExecutiveDomain["mappers"]["charts"],
    },
    registries: {
      metrics: {} as ExecutiveDomain["registries"]["metrics"],
    },
  };
}

test("GET action center returns sorted action item sections", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeActionCenterDomain,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost/api/admin/executive/action-center?from=2026-05-01&to=2026-05-25"),
    { params: Promise.resolve({ path: ["action-center"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.pageId, "action_center");
  assert.equal(body.data.sections.actionItems.length, 1);
  assert.equal(body.data.sections.severitySummary.high, 1);
});

test("PATCH action center updates workflow state for admins", async () => {
  const handlers = createExecutiveRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 9, resetAt: Date.now() }),
    createDomain: makeActionCenterDomain,
  });

  const response = await handlers.PATCH(
    new NextRequest("http://localhost/api/admin/executive/action-center/item-1", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "in_progress", assignedOwnerId: "owner-1" }),
    }),
    { params: Promise.resolve({ path: ["action-center", "item-1"] }) },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "success");
  assert.equal(body.data.status, "in_progress");
  assert.equal(body.data.assignedOwnerId, "owner-1");
});
