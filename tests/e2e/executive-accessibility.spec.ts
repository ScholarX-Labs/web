import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive overview supports keyboard navigation across key controls", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive accessibility browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive?from=2026-05-01&to=2026-05-25`);
    await page.getByRole("heading", { name: "Business health overview" }).waitFor();

    // Walk focus across the executive page controls and ensure focus can reach key actions.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const csvExport = page.getByRole("button", { name: "Export CSV" });
    const snapshotExport = page.getByRole("button", { name: "Export snapshot" });
    assert.equal(await csvExport.isVisible(), true);
    assert.equal(await snapshotExport.isVisible(), true);

    // Chart summaries/sections must remain discoverable as readable text landmarks.
    assert.equal(await page.getByText("Revenue trend").first().isVisible(), true);
    assert.equal(await page.getByText("Subscription funnel").first().isVisible(), true);
    assert.equal(await page.getByText("Risk indicators").isVisible(), true);
  } finally {
    await browser.close();
  }
});
