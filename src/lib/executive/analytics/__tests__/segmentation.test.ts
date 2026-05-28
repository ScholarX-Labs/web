import assert from "node:assert/strict";
import test from "node:test";
import { isInternalAdminSurface } from "../segmentation";

test("segmentation identifies internal admin paths", () => {
  assert.equal(isInternalAdminSurface("/admin/executive"), true);
  assert.equal(isInternalAdminSurface("/api/admin/executive"), true);
});

test("segmentation keeps public surfaces out of internal segment", () => {
  assert.equal(isInternalAdminSurface("/"), false);
  assert.equal(isInternalAdminSurface("/opportunities"), false);
  assert.equal(isInternalAdminSurface("/api/opportunities/search"), false);
});

