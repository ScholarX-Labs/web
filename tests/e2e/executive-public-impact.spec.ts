import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive public growth page renders public impact governance", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive public impact browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/public-growth?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Public Website & Growth" }).waitFor();
    assert.equal(await page.getByText("Public impact metrics").isVisible(), true);
  } finally {
    await browser.close();
  }
});
