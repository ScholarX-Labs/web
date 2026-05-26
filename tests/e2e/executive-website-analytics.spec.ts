import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

test("executive public growth page renders website analytics", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive website analytics browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const to = new Date();
    const from = new Date(to);
    from.setUTCDate(to.getUTCDate() - 29);
    const fromDate = isoDate(from);
    const toDate = isoDate(to);

    await page.goto(`${baseUrl}/admin/executive/public-growth?from=${fromDate}&to=${toDate}`);

    await page.getByRole("heading", { name: "Public Website & Growth" }).waitFor();
    assert.equal(await page.getByText("Website analytics").isVisible(), true);
    assert.equal(await page.getByText("Traffic sources").isVisible(), true);
  } finally {
    await browser.close();
  }
});
