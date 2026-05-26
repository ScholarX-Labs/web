import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive overview renders business-health dashboard", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive overview browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Business health overview" }).waitFor();
    await page.getByRole("region", { name: "Business health key metrics" }).waitFor();

    assert.equal(await page.getByText("Gross revenue").isVisible(), true);
    assert.equal(await page.getByText("Revenue trend").first().isVisible(), true);
    assert.equal(await page.getByText("Subscription funnel").first().isVisible(), true);
    assert.equal(await page.getByText("Risk indicators").isVisible(), true);
  } finally {
    await browser.close();
  }
});
