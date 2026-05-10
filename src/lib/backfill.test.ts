import test from "node:test";
import assert from "node:assert/strict";
import { slugify, randomSuffix } from "./username-utils";

test("slugify", async (t) => {
  await t.test("combines first and last name with dot", () => {
    assert.equal(slugify("John.Doe"), "john.doe");
  });

  await t.test("lowercases the input", () => {
    assert.equal(slugify("John.Doe"), "john.doe");
  });

  await t.test("removes special characters", () => {
    assert.equal(slugify("John!@#.Doe$%^"), "john.doe");
  });

  await t.test("allows dots, hyphens, and underscores", () => {
    assert.equal(slugify("John.Doe-Smith_III"), "john.doe-smith_iii");
  });

  await t.test("trims leading non-alphanumeric characters", () => {
    assert.equal(slugify("..john.doe"), "john.doe");
  });

  await t.test("trims trailing non-alphanumeric characters", () => {
    assert.equal(slugify("john.doe.."), "john.doe");
  });

  await t.test("slices to max 26 characters", () => {
    const long = "a".repeat(30) + "." + "b".repeat(30);
    const result = slugify(long);
    assert.ok(result.length <= 26);
    assert.equal(result, "aaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  await t.test("handles empty string", () => {
    assert.equal(slugify(""), "");
  });

  await t.test("handles Arabic name text", () => {
    const result = slugify("أحمد.محمد");
    assert.equal(result, "");
  });

  await t.test("handles mixed Latin-Arabic name", () => {
    const result = slugify("Ahmed.أحمد");
    assert.equal(result, "ahmed");
  });
});

test("randomSuffix", async (t) => {
  await t.test("generates string of at most the requested length", () => {
    assert.ok(randomSuffix(6).length <= 6);
    assert.ok(randomSuffix(12).length <= 12);
  });

  await t.test("generates alphanumeric characters", () => {
    const suffix = randomSuffix(100);
    assert.ok(/^[a-z0-9]+$/.test(suffix));
  });

  await t.test("generates unique values", () => {
    const results = new Set<string>();
    for (let i = 0; i < 100; i++) {
      results.add(randomSuffix(8));
    }
    assert.ok(results.size > 90, "Should have at least 90 unique values out of 100");
  });
});
