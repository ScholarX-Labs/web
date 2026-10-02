import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  resolveCourseLearningOutcomes,
  DEFAULT_SCHOLARSHIP_OUTCOMES_EN,
  DEFAULT_SCHOLARSHIP_OUTCOMES_AR,
} from "../course-outcomes";

describe("resolveCourseLearningOutcomes", () => {
  it("returns default English scholarship outcomes when course has no outcomes", () => {
    const outcomes = resolveCourseLearningOutcomes(null);
    assert.deepEqual(outcomes, DEFAULT_SCHOLARSHIP_OUTCOMES_EN);
    assert.ok(outcomes[0].includes("scholarship"));
  });

  it("returns default Arabic outcomes when locale is 'ar'", () => {
    const outcomes = resolveCourseLearningOutcomes({}, { locale: "ar" });
    assert.deepEqual(outcomes, DEFAULT_SCHOLARSHIP_OUTCOMES_AR);
    assert.ok(outcomes[0].includes("المنح الدراسية"));
  });

  it("returns custom course outcomes when provided", () => {
    const custom = [
      "Secure fully-funded Erasmus Mundus admission",
      "Structure high-scoring motivation essays",
    ];
    const outcomes = resolveCourseLearningOutcomes({ learningOutcomes: custom });
    assert.deepEqual(outcomes, custom);
  });

  it("ignores whitespace-only entries in custom outcomes", () => {
    const custom = ["  ", "Valid Outcome", ""];
    const outcomes = resolveCourseLearningOutcomes({ learningOutcomes: custom });
    assert.deepEqual(outcomes, ["Valid Outcome"]);
  });

  it("respects the limit option", () => {
    const outcomes = resolveCourseLearningOutcomes(null, { limit: 3 });
    assert.equal(outcomes.length, 3);
    assert.deepEqual(outcomes, DEFAULT_SCHOLARSHIP_OUTCOMES_EN.slice(0, 3));
  });
});
