import assert from "node:assert/strict";
import test from "node:test";
import { KPI_EVENT_MAPPING } from "../kpi-mapping";
import { ANALYTICS_EVENTS } from "../constants";

test("KPI event mapping includes required growth metrics", () => {
  assert.deepEqual(KPI_EVENT_MAPPING["growth.website_visits"], [
    ANALYTICS_EVENTS.WEBSITE_VISIT,
  ]);
  assert.deepEqual(KPI_EVENT_MAPPING["growth.cta_clicks_total"], [
    ANALYTICS_EVENTS.CTA_CLICK,
  ]);
  assert.deepEqual(KPI_EVENT_MAPPING["growth.signup_starts"], [
    ANALYTICS_EVENTS.SIGNUP_STARTED,
  ]);
  assert.deepEqual(KPI_EVENT_MAPPING["growth.signup_completions"], [
    ANALYTICS_EVENTS.SIGNUP_COMPLETED,
  ]);
});

