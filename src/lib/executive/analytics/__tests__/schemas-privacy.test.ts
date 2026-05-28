import assert from "node:assert/strict";
import test from "node:test";
import { analyticsEventsRouteInputSchema } from "../schemas";
import { sanitizeAnalyticsProperties } from "../privacy";

test("analytics event schema accepts supported event payload", () => {
  const parsed = analyticsEventsRouteInputSchema.safeParse({
    event: "cta_click",
    properties: {
      cta_id: "hero_start",
      cta_label: "Get Started",
      count: 1,
      active: true,
      optional: null,
    },
  });

  assert.equal(parsed.success, true);
});

test("analytics event schema rejects unsupported event names", () => {
  const parsed = analyticsEventsRouteInputSchema.safeParse({
    event: "unknown_event",
    properties: {},
  });

  assert.equal(parsed.success, false);
});

test("sanitizeAnalyticsProperties strips forbidden keys", () => {
  const sanitized = sanitizeAnalyticsProperties({
    cta_id: "hero_start",
    token: "should-be-removed",
    accessToken: "should-be-removed",
    safe_flag: true,
  });

  assert.equal(sanitized.cta_id, "hero_start");
  assert.equal(sanitized.safe_flag, true);
  assert.equal("token" in sanitized, false);
  assert.equal("accessToken" in sanitized, false);
});

