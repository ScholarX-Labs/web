/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "node:child_process";
import { expect, test, describe } from "vitest";
import path from "node:path";

describe("Translation coverage", () => {
  test("check-translations script should pass for current repo", () => {
    try {
      const scriptPath = path.join(process.cwd(), "scripts", "check-translations.mjs");
      const out = execSync(`node ${scriptPath}`, { encoding: "utf8", stdio: "pipe" });
      expect(out).toContain("Translation coverage check passed");
    } catch (error: any) {
      throw new Error(`Translations check failed: ${error.stderr || error.stdout || error.message}`);
    }
  });
});
