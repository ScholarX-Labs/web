import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRateLimitPrefix,
  buildRateLimitSubject,
  createFallbackDecision,
  hashRateLimitSubject,
} from "./rate-limit.utils";

test("hashRateLimitSubject is deterministic", () => {
  assert.equal(
    hashRateLimitSubject("alpha"),
    hashRateLimitSubject("alpha"),
  );
});

test("buildRateLimitSubject changes when parts change", () => {
  const a = buildRateLimitSubject(["admin", "user-1", "/api/admin/stats"]);
  const b = buildRateLimitSubject(["admin", "user-2", "/api/admin/stats"]);
  assert.notEqual(a, b);
});

test("buildRateLimitPrefix applies the app Redis namespace", () => {
  assert.equal(
    buildRateLimitPrefix("public.profile.ip.minute"),
    "scholarx:v2:web:ratelimit:public.profile.ip.minute",
  );
});

test("createFallbackDecision respects fail-open policy", () => {
  const result = createFallbackDecision("fail-open", 60);
  assert.equal(result.allowed, true);
  assert.equal(result.source, "fallback");
});

test("createFallbackDecision respects fail-closed policy", () => {
  const result = createFallbackDecision("fail-closed", 60);
  assert.equal(result.allowed, false);
  assert.equal(result.reason, "limiter_unavailable");
});
