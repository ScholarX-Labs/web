import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright";

const baseUrl = process.env.EXECUTIVE_E2E_BASE_URL;

test("executive courses and lessons page renders course analytics", async (t) => {
  if (!baseUrl) {
    t.skip("Set EXECUTIVE_E2E_BASE_URL to run executive courses and lessons browser coverage.");
    return;
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}/admin/executive/courses-lessons?from=2026-05-01&to=2026-05-25`);

    await page.getByRole("heading", { name: "Courses and lessons" }).waitFor();
    await page.getByRole("region", { name: "Course analytics key metrics" }).waitFor();

    assert.equal(await page.getByText("Course leaderboard").isVisible(), true);
    assert.equal(await page.getByText("Problem course signals").isVisible(), true);
  } finally {
    await browser.close();
  }
});
