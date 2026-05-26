import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive finance page renders unit economics overview", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive finance browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/finance?from=2026-05-01&to=2026-05-25&courseId=course-1`);

    await page.getByRole("heading", { name: "Finance and unit economics" }).waitFor();
    await page.getByRole("heading", { name: "Course business performance" }).waitFor();

    assert.equal(await page.getByText("Gross revenue").isVisible(), true);
    assert.equal(await page.getByText("Selected course").isVisible(), true);
  } finally {
    await browser.close();
  }
});
