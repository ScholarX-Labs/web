import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { ExecutiveError } from "@/domain/executive/application/executive-errors";
import { createExecutiveExportRouteHandlers } from "../export/route-handlers";
import type { ExecutiveExportServicePort } from "@/domain/executive/contracts/export-renderer.contract";
import type { ExecutiveFeatureFlags } from "@/lib/executive/feature-flags";

const enabledFlags: ExecutiveFeatureFlags = {
  EXECUTIVE_DASHBOARD_ENABLED: true,
  EXECUTIVE_TEAM_OPERATIONS_ENABLED: false,
  EXECUTIVE_FINANCE_ENABLED: false,
  PUBLIC_IMPACT_GOVERNANCE_ENABLED: true,
  EXECUTIVE_AI_HEATMAP_ENABLED: false,
};

function request(body: unknown) {
  return new NextRequest("http://localhost/api/admin/executive/export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("POST export returns file response for admins", async () => {
  let capturedRequest: unknown;
  const service: ExecutiveExportServicePort = {
    generate: async (_actor, exportRequest) => {
      capturedRequest = exportRequest;
      return {
        exportId: "export-1",
        fileName: "overview-2026-05-01-to-2026-05-25.csv",
        contentType: "text/csv",
        body: "header\nvalue",
        generatedAt: "2026-05-25T12:00:00.000Z",
        auditId: "audit-1",
        redactionNotes: [],
      };
    },
  };

  const handlers = createExecutiveExportRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 4, resetAt: Date.now() }),
    createService: () => service,
  });

  const response = await handlers.POST(request({
    pageId: "overview",
    format: "csv",
    query: {
      from: "2026-05-01",
      to: "2026-05-25",
      page: 1,
      pageSize: 25,
      direction: "desc",
    },
  }));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.match(response.headers.get("content-disposition") ?? "", /overview-2026-05-01-to-2026-05-25\.csv/);
  assert.equal(await response.text(), "header\nvalue");
  assert.deepEqual(capturedRequest, {
    pageId: "overview",
    format: "csv",
    query: {
      from: "2026-05-01",
      to: "2026-05-25",
      page: 1,
      pageSize: 25,
      direction: "desc",
    },
  });
});

test("POST export returns 413 when the export request is oversized", async () => {
  const service: ExecutiveExportServicePort = {
    generate: async () => {
      throw new ExecutiveError(
        "PAYLOAD_TOO_LARGE",
        413,
        "Exports cannot exceed 365 days in a single request.",
      );
    },
  };

  const handlers = createExecutiveExportRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => ({ user: { id: "admin-1", role: "admin" } }),
    checkRateLimit: async () => ({ allowed: true, remaining: 4, resetAt: Date.now() }),
    createService: () => service,
  });

  const response = await handlers.POST(request({
    pageId: "overview",
    format: "snapshot",
    query: {
      from: "2025-01-01",
      to: "2026-05-25",
      page: 1,
      pageSize: 25,
      direction: "desc",
    },
  }));

  assert.equal(response.status, 413);
  const body = await response.json();
  assert.equal(body.code, "PAYLOAD_TOO_LARGE");
});

test("POST export requires authentication", async () => {
  const handlers = createExecutiveExportRouteHandlers({
    getFlags: () => enabledFlags,
    getSession: async () => null,
    checkRateLimit: async () => ({ allowed: true, remaining: 4, resetAt: Date.now() }),
    createService: () => ({
      generate: async () => {
        throw new Error("not used");
      },
    }),
  });

  const response = await handlers.POST(request({
    pageId: "overview",
    format: "csv",
    query: {
      from: "2026-05-01",
      to: "2026-05-25",
      page: 1,
      pageSize: 25,
      direction: "desc",
    },
  }));

  assert.equal(response.status, 401);
});
