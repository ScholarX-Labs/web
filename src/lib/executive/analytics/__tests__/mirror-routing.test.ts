import assert from "node:assert/strict";
import test from "node:test";
import { shouldMirrorEvent } from "../mirror-routing";
import { ANALYTICS_EVENTS } from "../constants";

test("mirror routing includes executive KPI events", () => {
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.WEBSITE_VISIT), true);
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.CTA_CLICK), true);
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.SIGNUP_STARTED), true);
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.SIGNUP_COMPLETED), true);
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.AI_SEARCH), true);
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.OPPORTUNITY_APPLY_CLICK), true);
});

test("mirror routing excludes product-only observational events", () => {
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.OPPORTUNITY_VIEW), false);
  assert.equal(shouldMirrorEvent(ANALYTICS_EVENTS.OPPORTUNITY_SAVE), false);
});

