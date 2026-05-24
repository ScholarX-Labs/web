import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

const loadHandlersFactory = async () => {
  process.env.DATABASE_URL ??=
    "postgres://postgres:postgres@localhost:5432/postgres";
  const mod = await import("./route-handlers");
  return mod.createAdminCacheStatusRouteHandlers;
};

test("GET /api/admin/cache-status requires admin access", async () => {
  const createAdminCacheStatusRouteHandlers = await loadHandlersFactory();
  const handlers = createAdminCacheStatusRouteHandlers({
    requireAdmin: async () => false,
    getCacheStatus: () =>
      ({
        enabled: true,
        circuitOpen: false,
        circuitCooldownMs: 30_000,
        consecutiveFailures: 0,
        lastFailureContext: null,
        lastFailureAt: null,
        metrics: { counts: {}, recentEvents: [] },
      }) as never,
    checkRateLimit: async () =>
      ({
        allowed: true,
        remaining: 10,
        resetAt: Date.now() + 60_000,
        source: "redis",
      }) as never,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost:3000/api/admin/cache-status"),
  );

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body?.error?.code, "UNAUTHORIZED");
});

test("GET /api/admin/cache-status returns 429 when rate limited", async () => {
  const createAdminCacheStatusRouteHandlers = await loadHandlersFactory();
  const resetAt = Date.now() + 45_000;
  const handlers = createAdminCacheStatusRouteHandlers({
    requireAdmin: async () => true,
    getCacheStatus: () =>
      ({
        enabled: true,
        circuitOpen: false,
        circuitCooldownMs: 30_000,
        consecutiveFailures: 0,
        lastFailureContext: null,
        lastFailureAt: null,
        metrics: { counts: {}, recentEvents: [] },
      }) as never,
    checkRateLimit: async () =>
      ({
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds: 45,
        source: "redis",
        reason: "limit_exceeded",
      }) as never,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost:3000/api/admin/cache-status"),
  );

  assert.equal(response.status, 429);
  const body = await response.json();
  assert.equal(body?.error?.code, "RATE_LIMITED");
  assert.ok(body?.error?.retryAfterSeconds >= 1);
});

test("GET /api/admin/cache-status returns status payload for admins", async () => {
  const createAdminCacheStatusRouteHandlers = await loadHandlersFactory();
  const handlers = createAdminCacheStatusRouteHandlers({
    requireAdmin: async () => true,
    getCacheStatus: () =>
      ({
        enabled: true,
        circuitOpen: true,
        circuitCooldownMs: 30_000,
        consecutiveFailures: 2,
        lastFailureContext: "cache:get:test",
        lastFailureAt: "2026-05-24T00:00:00.000Z",
        metrics: {
          counts: { "cache:get:hit": 5 },
          recentEvents: [],
        },
      }) as never,
    checkRateLimit: async () =>
      ({
        allowed: true,
        remaining: 12,
        resetAt: Date.now() + 60_000,
        source: "redis",
      }) as never,
  });

  const response = await handlers.GET(
    new NextRequest("http://localhost:3000/api/admin/cache-status", {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    }),
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body?.ok, true);
  assert.equal(body?.data?.redis?.circuitOpen, true);
  assert.equal(body?.data?.redis?.consecutiveFailures, 2);
  assert.equal(body?.data?.redis?.metrics?.counts?.["cache:get:hit"], 5);
  assert.equal(typeof body?.data?.generatedAt, "string");
});
