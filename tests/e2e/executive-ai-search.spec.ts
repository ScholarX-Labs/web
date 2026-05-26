import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive opportunities and AI page renders AI search quality", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive AI search browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/opportunities-ai?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Opportunities & AI" }).waitFor();
    assert.equal(await page.getByText("AI search quality").isVisible(), true);
    assert.equal(await page.getByText("AI usage by user").isVisible(), true);
  } finally {
    await browser.close();
  }
});
