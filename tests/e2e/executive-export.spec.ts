import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive overview exposes export actions", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive export browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Business health overview" }).waitFor();
    await page.getByRole("button", { name: "Export CSV" }).waitFor();
    await page.getByRole("button", { name: "Export snapshot" }).waitFor();

    assert.equal(await page.getByRole("button", { name: "Export CSV" }).isVisible(), true);
    assert.equal(await page.getByRole("button", { name: "Export snapshot" }).isVisible(), true);
  } finally {
    await browser.close();
  }
});
