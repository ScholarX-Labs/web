import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

const viewports = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "mobile", width: 375, height: 812 },
] as const;

test("executive overview remains readable across desktop, tablet, and mobile viewports", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive responsive browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });

      await page.goto(`${baseUrl}/admin/executive?from=2026-05-01&to=2026-05-25`);
      await page.getByRole("heading", { name: "Business health overview" }).waitFor();

      const metricsRegion = page.getByRole("region", { name: "Business health key metrics" });
      const metricsBox = await metricsRegion.boundingBox();
      assert.ok(metricsBox && metricsBox.width > 0 && metricsBox.height > 0);

      const revenueLabel = page.getByText("Revenue trend").first();
      const funnelLabel = page.getByText("Subscription funnel").first();
      assert.equal(await revenueLabel.isVisible(), true);
      assert.equal(await funnelLabel.isVisible(), true);

      const screenshot = await page.screenshot({ fullPage: true });
      assert.ok(screenshot.byteLength > 0, `Expected non-empty screenshot for ${viewport.label}`);

      await page.close();
    }
  } finally {
    await browser.close();
  }
});
