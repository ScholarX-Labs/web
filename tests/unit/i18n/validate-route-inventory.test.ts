/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "node:child_process";
import test, { describe } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

describe("Route inventory validation", () => {
  test("validate-route-inventory script should pass for current repo", () => {
    try {
      const scriptPath = path.join(process.cwd(), "scripts", "validate-route-inventory.mjs");
      const out = execSync(`node ${scriptPath}`, { encoding: "utf8", stdio: "pipe" });
      assert.ok(out.includes("Route inventory validation passed"));
    } catch (error: any) {
      throw new Error(`Route inventory validation failed: ${error.stderr || error.stdout || error.message}`);
    }
  });
});
