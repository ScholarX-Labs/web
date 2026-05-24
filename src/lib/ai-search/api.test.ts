import assert from "node:assert/strict";
import test from "node:test";
import { getOpportunityById } from "./api";

test("getOpportunityById caches authoritative 404 responses", async () => {
  const originalFetch = global.fetch;
  const id = `missing-${Date.now()}-404`;
  let fetchCalls = 0;

  global.fetch = async () => {
    fetchCalls += 1;
    return new Response(null, { status: 404 });
  };

  try {
    const first = await getOpportunityById(id, "en");
    const second = await getOpportunityById(id, "en");

    assert.equal(first, null);
    assert.equal(second, null);
    assert.equal(fetchCalls, 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test("getOpportunityById does not negative-cache transient upstream failures", async () => {
  const originalFetch = global.fetch;
  const id = `rate-limited-${Date.now()}-429`;
  let fetchCalls = 0;

  global.fetch = async () => {
    fetchCalls += 1;
    return new Response(null, { status: 429 });
  };

  try {
    const first = await getOpportunityById(id, "en");
    const second = await getOpportunityById(id, "en");

    assert.equal(first, null);
    assert.equal(second, null);
    assert.equal(fetchCalls, 2);
  } finally {
    global.fetch = originalFetch;
  }
});
