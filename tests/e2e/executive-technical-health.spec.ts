import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive technical health page renders operational signals", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive technical health browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/technical-health?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Technical health" }).waitFor();
    await page.getByText("Freshness grid").waitFor();

    assert.equal(await page.getByText("Pipeline health").isVisible(), true);
    assert.equal(await page.getByText("Email pipeline health").isVisible(), true);
    assert.equal(await page.getByText("Admin audit log").isVisible(), true);
  } finally {
    await browser.close();
  }
});
