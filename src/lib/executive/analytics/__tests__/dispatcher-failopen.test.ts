import assert from "node:assert/strict";
import test from "node:test";
import { dispatchFailOpen } from "../dispatcher";

test("dispatchFailOpen returns true when action succeeds", async () => {
  const ok = await dispatchFailOpen(async () => {}, "success-case");
  assert.equal(ok, true);
});

test("dispatchFailOpen returns false and does not throw when action fails", async () => {
  const ok = await dispatchFailOpen(async () => {
    throw new Error("simulated failure");
  }, "failure-case");
  assert.equal(ok, false);
});

