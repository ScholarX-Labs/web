import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive users page renders activity analytics", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive users browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/users?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Users and activity" }).waitFor();
    await page.getByRole("region", { name: "User analytics key metrics" }).waitFor();

    assert.equal(await page.getByText("New users").isVisible(), true);
    assert.equal(await page.getByText("24x7 activity heatmap").first().isVisible(), true);
    assert.equal(await page.getByText("Peak activity").isVisible(), true);
  } finally {
    await browser.close();
  }
});
