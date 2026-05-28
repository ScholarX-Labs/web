import assert from "node:assert/strict";
import test from "node:test";
import { ANALYTICS_EVENTS } from "../constants";

test("search and opportunity event constants expose expected names", () => {
  assert.equal(ANALYTICS_EVENTS.AI_SEARCH, "ai_search");
  assert.equal(
    ANALYTICS_EVENTS.OPPORTUNITY_APPLY_CLICK,
    "opportunity_apply_click",
  );
  assert.equal(ANALYTICS_EVENTS.OPPORTUNITY_SAVE, "opportunity_save");
  assert.equal(ANALYTICS_EVENTS.OPPORTUNITY_VIEW, "opportunity_view");
});

