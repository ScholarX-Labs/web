import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive action center page renders operational queue", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive action center browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/action-center?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Action Center" }).waitFor();
    await page.getByRole("region", { name: "Action Center severity summary" }).waitFor();

    assert.equal(await page.getByText("Action items").isVisible(), true);
  } finally {
    await browser.close();
  }
});
