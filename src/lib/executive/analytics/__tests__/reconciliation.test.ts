import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateVariancePercent,
  isWithinVarianceThreshold,
} from "../reconciliation";

test("calculateVariancePercent computes absolute percentage variance", () => {
  assert.equal(calculateVariancePercent(100, 96), 4);
  assert.equal(calculateVariancePercent(100, 104), 4);
});

test("isWithinVarianceThreshold handles nominal and edge cases", () => {
  assert.equal(isWithinVarianceThreshold(100, 95), true);
  assert.equal(isWithinVarianceThreshold(100, 94), false);
  assert.equal(isWithinVarianceThreshold(0, 0), true);
  assert.equal(isWithinVarianceThreshold(0, 1), false);
});

